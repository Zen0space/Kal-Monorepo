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

async function seed() {
  console.log("🌱 Starting seed...");

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(MONGODB_DATABASE);

    // Clear existing and insert fresh
    await db.collection("foods").deleteMany({});
    await db.collection("foods").insertMany(foods);
    console.log(`✅ Inserted ${foods.length} foods`);

    // Create text index for search
    await db.collection("foods").createIndex({ name: "text" });
    console.log("✅ Created text index on foods collection");

    console.log("🎉 Seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seed();
