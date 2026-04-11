import webpush from "web-push";
import type { PushSubscription, SendResult } from "web-push";
import type { Db } from "mongodb";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PushSubscriptionDoc {
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
  createdAt: Date;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
  tag?: string;
}

// ─── Initialization ──────────────────────────────────────────────────────────

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@kalori.app";

let initialized = false;

function ensureInitialized(): void {
  if (initialized) return;

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn(
      "[Web Push] VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY not set. Push notifications will not work."
    );
    return;
  }

  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  initialized = true;
  console.log("[Web Push] Initialized with VAPID credentials");
}

// ─── Collection Helper ───────────────────────────────────────────────────────

const COLLECTION = "push_subscriptions";

export function getPushCollection(db: Db) {
  return db.collection<PushSubscriptionDoc>(COLLECTION);
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function getVapidPublicKey(): string {
  return VAPID_PUBLIC_KEY;
}

/**
 * Send a push notification to a single subscription.
 * Returns true if sent successfully, false if the subscription is expired/invalid (and was deleted).
 */
export async function sendPushNotification(
  db: Db,
  subscription: PushSubscriptionDoc,
  payload: PushPayload
): Promise<boolean> {
  ensureInitialized();

  if (!initialized) {
    console.warn("[Web Push] Not initialized — skipping notification");
    return false;
  }

  const pushSubscription: PushSubscription = {
    endpoint: subscription.endpoint,
    keys: subscription.keys,
  };

  const jsonPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || "/dashboard",
    icon: payload.icon || "/assets/icon-logo-192x192.png",
    badge: payload.badge || "/assets/icon-logo-192x192.png",
    tag: payload.tag,
  });

  try {
    await webpush.sendNotification(pushSubscription, jsonPayload);
    return true;
  } catch (error) {
    const statusCode = (error as SendResult & { statusCode?: number })
      .statusCode;

    // 410 Gone or 404 Not Found = subscription expired, remove it
    if (statusCode === 410 || statusCode === 404) {
      console.log(
        `[Web Push] Subscription expired (${statusCode}), removing: ${subscription.endpoint.slice(0, 60)}...`
      );
      await getPushCollection(db).deleteOne({
        endpoint: subscription.endpoint,
      });
      return false;
    }

    console.error("[Web Push] Failed to send notification:", error);
    return false;
  }
}

/**
 * Broadcast a push notification to all subscribed users.
 * Returns { sent, failed, expired } counts.
 */
export async function broadcastPushNotification(
  db: Db,
  payload: PushPayload
): Promise<{ sent: number; failed: number; expired: number }> {
  const col = getPushCollection(db);
  const subscriptions = await col.find({}).toArray();

  let sent = 0;
  let failed = 0;
  let expired = 0;

  // Send in batches of 50 to avoid overwhelming the push service
  const BATCH_SIZE = 50;
  for (let i = 0; i < subscriptions.length; i += BATCH_SIZE) {
    const batch = subscriptions.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map((sub) => sendPushNotification(db, sub, payload))
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        if (result.value) sent++;
        else expired++;
      } else {
        failed++;
      }
    }
  }

  console.log(
    `[Web Push] Broadcast complete: ${sent} sent, ${failed} failed, ${expired} expired`
  );
  return { sent, failed, expired };
}

/**
 * Send a push notification to all devices of a specific user.
 * Returns { sent, failed, expired } counts.
 */
export async function sendPushToUser(
  db: Db,
  userId: string,
  payload: PushPayload
): Promise<{ sent: number; failed: number; expired: number }> {
  const col = getPushCollection(db);
  const subscriptions = await col.find({ userId }).toArray();

  let sent = 0;
  let failed = 0;
  let expired = 0;

  const results = await Promise.allSettled(
    subscriptions.map((sub) => sendPushNotification(db, sub, payload))
  );

  for (const result of results) {
    if (result.status === "fulfilled") {
      if (result.value) sent++;
      else expired++;
    } else {
      failed++;
    }
  }

  return { sent, failed, expired };
}
