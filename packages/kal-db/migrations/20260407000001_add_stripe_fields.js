/**
 * Migration: Add Stripe subscription fields to users collection
 *
 * Adds stripeCustomerId, stripeSubscriptionId, and stripeCurrentPeriodEnd
 * to support Stripe subscription billing.
 */

export const up = async (db, client) => {
  // Add Stripe fields to all existing users (default to null)
  await db.collection("users").updateMany(
    { stripeCustomerId: { $exists: false } },
    {
      $set: {
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        stripeCurrentPeriodEnd: null,
      },
    }
  );

  // Create index on stripeCustomerId for webhook lookups
  // Use partialFilterExpression so null values are excluded from uniqueness
  await db.collection("users").createIndex(
    { stripeCustomerId: 1 },
    {
      unique: true,
      partialFilterExpression: { stripeCustomerId: { $type: "string" } },
    }
  );
};

export const down = async (db, client) => {
  // Drop the Stripe customer ID index
  await db
    .collection("users")
    .dropIndex("stripeCustomerId_1")
    .catch(() => {});

  // Remove Stripe fields from all users
  await db.collection("users").updateMany(
    {},
    {
      $unset: {
        stripeCustomerId: "",
        stripeSubscriptionId: "",
        stripeCurrentPeriodEnd: "",
      },
    }
  );
};
