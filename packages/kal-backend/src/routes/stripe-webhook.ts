import express, { Router } from "express";
import type { Collection } from "mongodb";
import { ObjectId } from "mongodb";
import type Stripe from "stripe";

import { getDB } from "../lib/db.js";
import { stripe, priceIdToTier } from "../lib/stripe.js";

import type { User } from "kal-shared";

const router: Router = Router();

/**
 * Stripe Webhook Handler
 *
 * IMPORTANT: This route must be mounted BEFORE express.json() middleware
 * because Stripe requires the raw body for signature verification.
 */
router.post(
  "/",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];

    if (!sig) {
      console.error("[Stripe Webhook] Missing stripe-signature header");
      return res.status(400).json({ error: "Missing stripe-signature header" });
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error("[Stripe Webhook] STRIPE_WEBHOOK_SECRET is not configured");
      return res.status(500).json({ error: "Webhook secret not configured" });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(
        `[Stripe Webhook] Signature verification failed: ${message}`
      );
      return res
        .status(400)
        .json({ error: `Webhook signature verification failed` });
    }

    const db = getDB();
    const users = db.collection<User>("users");

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          await handleCheckoutCompleted(
            event.data.object as Stripe.Checkout.Session,
            users
          );
          break;
        }
        case "customer.subscription.updated": {
          await handleSubscriptionUpdated(
            event.data.object as Stripe.Subscription,
            users
          );
          break;
        }
        case "customer.subscription.deleted": {
          await handleSubscriptionDeleted(
            event.data.object as Stripe.Subscription,
            users
          );
          break;
        }
        case "invoice.payment_failed": {
          await handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;
        }
        default: {
          console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(
        `[Stripe Webhook] Error handling ${event.type}: ${message}`
      );
      // Return 200 anyway to prevent Stripe from retrying
      // (we log the error and can investigate manually)
    }

    // Always return 200 to acknowledge receipt
    res.status(200).json({ received: true });
  }
);

/**
 * Handle checkout.session.completed
 * Triggered when a customer successfully completes the Stripe Checkout flow.
 */
async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  users: Collection<User>
) {
  const userId = session.client_reference_id;

  if (!userId) {
    console.error(
      "[Stripe Webhook] checkout.session.completed: No client_reference_id"
    );
    return;
  }

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;

  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id;

  if (!subscriptionId || !customerId) {
    console.error(
      "[Stripe Webhook] checkout.session.completed: Missing subscription or customer ID"
    );
    return;
  }

  // Retrieve the subscription to get the price ID and period end
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0]?.price?.id;

  if (!priceId) {
    console.error(
      "[Stripe Webhook] checkout.session.completed: No price ID found in subscription"
    );
    return;
  }

  const tier = priceIdToTier(priceId);

  await users.updateOne(
    { _id: new ObjectId(userId) as any },
    {
      $set: {
        tier,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        stripeCurrentPeriodEnd: new Date(
          subscription.current_period_end * 1000
        ),
        updatedAt: new Date(),
      },
    }
  );

  console.log(
    `[Stripe Webhook] checkout.session.completed: User ${userId} upgraded to ${tier}`
  );
}

/**
 * Handle customer.subscription.updated
 * Triggered when a subscription is changed (plan upgrade/downgrade, renewal, etc.)
 */
async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  users: Collection<User>
) {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id;

  if (!customerId) {
    console.error("[Stripe Webhook] subscription.updated: No customer ID");
    return;
  }

  const priceId = subscription.items.data[0]?.price?.id;
  if (!priceId) {
    console.error("[Stripe Webhook] subscription.updated: No price ID found");
    return;
  }

  const tier = priceIdToTier(priceId);

  // If the subscription is set to cancel at period end, keep the current tier
  // but update the period end so we know when to downgrade
  const updateFields: Record<string, any> = {
    stripeSubscriptionId: subscription.id,
    stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
    updatedAt: new Date(),
  };

  // Only update tier if subscription is active (not pending cancellation)
  if (subscription.status === "active" && !subscription.cancel_at_period_end) {
    updateFields.tier = tier;
  }

  await users.updateOne(
    { stripeCustomerId: customerId },
    { $set: updateFields }
  );

  console.log(
    `[Stripe Webhook] subscription.updated: Customer ${customerId} → tier ${tier} (status: ${subscription.status}, cancel_at_period_end: ${subscription.cancel_at_period_end})`
  );
}

/**
 * Handle customer.subscription.deleted
 * Triggered when a subscription is fully cancelled (end of billing period or immediate).
 */
async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  users: Collection<User>
) {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id;

  if (!customerId) {
    console.error("[Stripe Webhook] subscription.deleted: No customer ID");
    return;
  }

  await users.updateOne(
    { stripeCustomerId: customerId },
    {
      $set: {
        tier: "free",
        stripeSubscriptionId: null,
        stripeCurrentPeriodEnd: null,
        updatedAt: new Date(),
      },
    }
  );

  console.log(
    `[Stripe Webhook] subscription.deleted: Customer ${customerId} downgraded to free`
  );
}

/**
 * Handle invoice.payment_failed
 * Triggered when a subscription payment fails.
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId =
    typeof invoice.customer === "string"
      ? invoice.customer
      : invoice.customer?.id;

  if (!customerId) {
    console.error("[Stripe Webhook] invoice.payment_failed: No customer ID");
    return;
  }

  // Log the payment failure — we don't downgrade immediately because
  // Stripe will retry the payment. The subscription.deleted event
  // will fire if all retries fail and the subscription is cancelled.
  console.warn(
    `[Stripe Webhook] invoice.payment_failed: Customer ${customerId} — payment failed for invoice ${invoice.id}`
  );
}

export { router as stripeWebhookRouter };
