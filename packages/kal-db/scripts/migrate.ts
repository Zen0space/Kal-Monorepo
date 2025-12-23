import "dotenv/config";
import { MongoClient } from "mongodb";

const {
  MONGODB_HOST = "localhost",
  MONGODB_PORT = "27017",
  MONGODB_USER,
  MONGODB_PASSWORD,
  MONGODB_DATABASE,
} = process.env;

const uri = `mongodb://${MONGODB_USER}:${MONGODB_PASSWORD}@${MONGODB_HOST}:${MONGODB_PORT}/${MONGODB_DATABASE}?authSource=admin`;

async function migrate() {
  console.log("🚀 Starting migrations...");

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(MONGODB_DATABASE);

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

    // Create indexes
    await db.collection("users").createIndex({ logtoId: 1 }, { unique: true });
    await db.collection("users").createIndex({ email: 1 }, { unique: true });
    console.log("✅ Created indexes on 'users' collection");

    await db.collection("food_entries").createIndex({ userId: 1, date: -1 });
    await db.collection("food_entries").createIndex({ userId: 1, createdAt: -1 });
    console.log("✅ Created indexes on 'food_entries' collection");

    console.log("🎉 Migrations completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

migrate();
