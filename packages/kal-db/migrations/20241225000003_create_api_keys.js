/**
 * Migration: Create api_keys collection
 * 
 * Creates the api_keys collection with indexes for:
 * - Fast key lookup (authentication)
 * - User key listing
 * - Expiration queries
 */

export const up = async (db, _client) => {
  // Create api_keys collection
  const collections = await db.listCollections({ name: "api_keys" }).toArray();
  if (collections.length === 0) {
    await db.createCollection("api_keys");
    console.log("✅ Created api_keys collection");
  } else {
    console.log("ℹ️  api_keys collection already exists");
  }

  // Index for fast key lookup (authentication) - key is hashed
  await db.collection("api_keys").createIndex(
    { key: 1 },
    { unique: true, name: "key_unique" }
  );
  console.log("✅ Created key_unique index");

  // Index for listing user's keys
  await db.collection("api_keys").createIndex(
    { userId: 1, isRevoked: 1, createdAt: -1 },
    { name: "user_keys" }
  );
  console.log("✅ Created user_keys index");

  // Index for expiration cleanup queries
  await db.collection("api_keys").createIndex(
    { expiresAt: 1, isRevoked: 1 },
    { name: "expiration" }
  );
  console.log("✅ Created expiration index");
};

export const down = async (db, _client) => {
  try {
    await db.collection("api_keys").drop();
    console.log("✅ Dropped api_keys collection");
  } catch (e) {
    console.log("ℹ️  api_keys collection may not exist, skipping drop");
  }
};
