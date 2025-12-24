/**
 * Migration: Create core collections
 * Creates users and food_entries collections
 */

export const up = async (db, client) => {
  // Create collections if they don't exist
  const collections = await db.listCollections().toArray();
  const collectionNames = collections.map((c) => c.name);

  // Users collection
  if (!collectionNames.includes("users")) {
    await db.createCollection("users");
    console.log("✅ Created 'users' collection");
  }

  // Food entries collection
  if (!collectionNames.includes("food_entries")) {
    await db.createCollection("food_entries");
    console.log("✅ Created 'food_entries' collection");
  }

  // Foods collection (reference data)
  if (!collectionNames.includes("foods")) {
    await db.createCollection("foods");
    console.log("✅ Created 'foods' collection");
  }
};

export const down = async (db, client) => {
  // WARNING: This will delete all data in these collections
  // Only use this for development/testing
  console.log("⚠️  Dropping collections (development only)");
  
  try {
    await db.collection("foods").drop();
    console.log("✅ Dropped 'foods' collection");
  } catch (e) {
    // Collection might not exist
  }

  try {
    await db.collection("food_entries").drop();
    console.log("✅ Dropped 'food_entries' collection");
  } catch (e) {
    // Collection might not exist
  }

  try {
    await db.collection("users").drop();
    console.log("✅ Dropped 'users' collection");
  } catch (e) {
    // Collection might not exist
  }
};
