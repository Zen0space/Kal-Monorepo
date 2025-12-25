/**
 * Migration: Add user tiers for rate limiting
 * Adds tier field to users collection and creates rate_limit_usage collection
 */

export const up = async (db, client) => {
  // Add tier field to all existing users (default: 'free')
  const usersCollection = db.collection("users");
  const result = await usersCollection.updateMany(
    { tier: { $exists: false } },
    { $set: { tier: "free" } }
  );
  console.log(`✅ Updated ${result.modifiedCount} users with default tier 'free'`);

  // Create rate_limit_usage collection if it doesn't exist
  const collections = await db.listCollections({ name: "rate_limit_usage" }).toArray();
  if (collections.length === 0) {
    await db.createCollection("rate_limit_usage");
    console.log("✅ Created 'rate_limit_usage' collection");
  } else {
    console.log("ℹ️  'rate_limit_usage' collection already exists");
  }
};

export const down = async (db, client) => {
  // Remove tier field from users
  const usersCollection = db.collection("users");
  await usersCollection.updateMany(
    {},
    { $unset: { tier: "" } }
  );
  console.log("✅ Removed tier field from users");

  // Drop rate_limit_usage collection
  try {
    await db.collection("rate_limit_usage").drop();
    console.log("✅ Dropped 'rate_limit_usage' collection");
  } catch (e) {
    console.log("ℹ️  Could not drop rate_limit_usage collection:", e.message);
  }
};
