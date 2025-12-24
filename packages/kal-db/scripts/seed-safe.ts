/**
 * Safe seed script for production
 * Only seeds the foods collection if it's empty
 * This prevents data loss on redeployments
 */
import "dotenv/config";
import { MongoClient } from "mongodb";

// Support both individual env vars and a full DATABASE_URL
const getDatabaseUri = () => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  
  const {
    MONGODB_HOST = "localhost",
    MONGODB_PORT = "27017",
    MONGODB_USER,
    MONGODB_PASSWORD,
    MONGODB_DATABASE,
  } = process.env;
  
  return `mongodb://${MONGODB_USER}:${MONGODB_PASSWORD}@${MONGODB_HOST}:${MONGODB_PORT}/${MONGODB_DATABASE}?authSource=admin`;
};

const getDbName = () => {
  if (process.env.DATABASE_URL) {
    try {
      const url = new URL(process.env.DATABASE_URL);
      return url.pathname.slice(1).split("?")[0];
    } catch {
      return "kal";
    }
  }
  return process.env.MONGODB_DATABASE || "kal";
};

// Food database with calories
const foods = [
  { name: "White Rice", calories: 130, protein: 2.7, carbs: 28, fat: 0.3, serving: "100g" },
  { name: "Grilled Chicken", calories: 165, protein: 31, carbs: 0, fat: 3.6, serving: "100g" },
  { name: "Fried Tofu", calories: 271, protein: 17, carbs: 10, fat: 19, serving: "100g" },
  { name: "Scrambled Eggs", calories: 154, protein: 11, carbs: 1, fat: 12, serving: "2 eggs" },
  { name: "Banana", calories: 89, protein: 1.1, carbs: 23, fat: 0.3, serving: "1 medium" },
  { name: "Apple", calories: 52, protein: 0.3, carbs: 14, fat: 0.2, serving: "1 medium" },
  { name: "Salmon Fillet", calories: 208, protein: 20, carbs: 0, fat: 13, serving: "100g" },
  { name: "Greek Yogurt", calories: 100, protein: 17, carbs: 6, fat: 0.7, serving: "1 cup" },
  { name: "Avocado", calories: 160, protein: 2, carbs: 9, fat: 15, serving: "1/2 fruit" },
  { name: "Oatmeal", calories: 158, protein: 6, carbs: 27, fat: 3, serving: "1 cup" },
];

async function seedSafe() {
  console.log("🌱 Starting safe seed (will skip if data exists)...");

  const uri = getDatabaseUri();
  const dbName = getDbName();
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);
    const collection = db.collection("foods");

    // Check if collection already has data
    const count = await collection.countDocuments();
    
    if (count > 0) {
      console.log(`ℹ️  Foods collection already has ${count} documents - skipping seed`);
      console.log("💡 To force reseed, run 'pnpm seed' instead");
      return;
    }

    // Collection is empty, proceed with seeding
    await collection.insertMany(foods);
    console.log(`✅ Inserted ${foods.length} foods`);

    console.log("🎉 Safe seeding completed successfully!");
  } catch (error) {
    console.error("❌ Safe seeding failed:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seedSafe();
