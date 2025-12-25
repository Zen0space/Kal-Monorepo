/**
 * Migration: Create indexes for rate limit tracking
 * Adds compound index for fast lookups and TTL index for auto-cleanup
 */

export const up = async (db, client) => {
  const collection = db.collection("rate_limit_usage");

  // Compound index for fast lookups (userId + date)
  await collection.createIndex(
    { userId: 1, date: 1 },
    { unique: true, name: "userId_date_unique" }
  );
  console.log("✅ Created compound index on 'rate_limit_usage' (userId + date)");

  // TTL index: auto-delete records after 7 days
  await collection.createIndex(
    { updatedAt: 1 },
    { expireAfterSeconds: 7 * 24 * 60 * 60, name: "updatedAt_ttl" }
  );
  console.log("✅ Created TTL index on 'rate_limit_usage' (7 days expiry)");
};

export const down = async (db, client) => {
  const collection = db.collection("rate_limit_usage");

  try {
    await collection.dropIndex("userId_date_unique");
    console.log("✅ Dropped userId_date_unique index");
  } catch (e) {
    console.log("ℹ️  Could not drop userId_date_unique index:", e.message);
  }

  try {
    await collection.dropIndex("updatedAt_ttl");
    console.log("✅ Dropped updatedAt_ttl index");
  } catch (e) {
    console.log("ℹ️  Could not drop updatedAt_ttl index:", e.message);
  }
};
