/**
 * Migration: Create indexes for core collections
 * Sets up indexes for performance and data integrity
 */

export const up = async (db, client) => {
  // Users collection indexes
  await db.collection("users").createIndex({ logtoId: 1 }, { unique: true });
  await db.collection("users").createIndex({ email: 1 }, { unique: true });
  console.log("✅ Created indexes on 'users' collection");

  // Food entries collection indexes
  await db.collection("food_entries").createIndex({ userId: 1, date: -1 });
  await db.collection("food_entries").createIndex({ userId: 1, createdAt: -1 });
  console.log("✅ Created indexes on 'food_entries' collection");

  // Foods collection indexes (for search)
  await db.collection("foods").createIndex({ name: "text" });
  await db.collection("foods").createIndex({ name: 1 });
  console.log("✅ Created indexes on 'foods' collection");
};

export const down = async (db, client) => {
  // Drop indexes (keeping collections)
  try {
    await db.collection("users").dropIndex("logtoId_1");
    await db.collection("users").dropIndex("email_1");
    console.log("✅ Dropped indexes on 'users' collection");
  } catch (e) {
    console.log("ℹ️  Could not drop users indexes:", e.message);
  }

  try {
    await db.collection("food_entries").dropIndex("userId_1_date_-1");
    await db.collection("food_entries").dropIndex("userId_1_createdAt_-1");
    console.log("✅ Dropped indexes on 'food_entries' collection");
  } catch (e) {
    console.log("ℹ️  Could not drop food_entries indexes:", e.message);
  }

  try {
    await db.collection("foods").dropIndex("name_text");
    await db.collection("foods").dropIndex("name_1");
    console.log("✅ Dropped indexes on 'foods' collection");
  } catch (e) {
    console.log("ℹ️  Could not drop foods indexes:", e.message);
  }
};
