/**
 * Migration: Create push_subscriptions collection
 *
 * Stores Web Push API subscriptions for each user/device.
 * Used by the push notification system to send OS-level notifications.
 *
 * Indexes:
 * - endpoint_unique: fast lookup + deduplication by push endpoint URL
 * - user_id: find all subscriptions for a given user
 */

export const up = async (db, _client) => {
  // Create push_subscriptions collection
  const collections = await db
    .listCollections({ name: "push_subscriptions" })
    .toArray();
  if (collections.length === 0) {
    await db.createCollection("push_subscriptions");
    console.log("✅ Created push_subscriptions collection");
  } else {
    console.log("ℹ️  push_subscriptions collection already exists");
  }

  // Drop any pre-existing auto-named indexes (from ensurePushIndexes at startup)
  // so we can recreate them with proper names
  const col = db.collection("push_subscriptions");
  try {
    await col.dropIndex("endpoint_1");
    console.log("ℹ️  Dropped legacy endpoint_1 index");
  } catch (_) {
    // Index doesn't exist — that's fine
  }
  try {
    await col.dropIndex("userId_1");
    console.log("ℹ️  Dropped legacy userId_1 index");
  } catch (_) {
    // Index doesn't exist — that's fine
  }

  // Unique index on endpoint — each push endpoint is globally unique
  await col.createIndex(
    { endpoint: 1 },
    { unique: true, name: "endpoint_unique" }
  );
  console.log("✅ Created endpoint_unique index");

  // Index for finding all subscriptions by user
  await col.createIndex({ userId: 1 }, { name: "user_id" });
  console.log("✅ Created user_id index");
};

export const down = async (db, _client) => {
  try {
    await db.collection("push_subscriptions").drop();
    console.log("✅ Dropped push_subscriptions collection");
  } catch (e) {
    console.log(
      "ℹ️  push_subscriptions collection may not exist, skipping drop"
    );
  }
};
