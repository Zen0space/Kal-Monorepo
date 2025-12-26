import "dotenv/config";
import { MongoClient } from "mongodb";
import { naturalFoods, halalFoods } from "./data";

const {
  MONGODB_HOST = "localhost",
  MONGODB_PORT = "27017",
  MONGODB_USER,
  MONGODB_PASSWORD,
  MONGODB_DATABASE,
} = process.env;

// Support both individual env vars and a full DATABASE_URL
const getDatabaseUri = () => {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
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
  return MONGODB_DATABASE || "kal";
};

/**
 * Safe seed script for production
 * - Normal mode: Only seeds collections if they're empty
 * - Force mode (FORCE_SEED=true): Drops and reseeds everything
 */
async function seedSafe() {
  const forceMode = process.env.FORCE_SEED === "true";
  
  if (forceMode) {
    console.log("🔥 FORCE_SEED=true detected - will drop and reseed all collections!");
  } else {
    console.log("🌱 Starting safe seed (will skip if data exists)...");
  }

  const uri = getDatabaseUri();
  const dbName = getDbName();
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);
    
    const foodsCollection = db.collection("foods");
    const foodsCount = await foodsCollection.countDocuments();
    
    if (forceMode && foodsCount > 0) {
      console.log(`🗑️  Force mode: Dropping ${foodsCount} items from 'foods' collection...`);
      await foodsCollection.deleteMany({});
    }
    
    const shouldSeedFoods = forceMode || foodsCount === 0;
    
    if (shouldSeedFoods) {
      await foodsCollection.insertMany(naturalFoods);
      console.log(`✅ Inserted ${naturalFoods.length} items into 'foods' collection`);
      await foodsCollection.createIndex({ name: "text" });
      await foodsCollection.createIndex({ category: 1 });
      console.log("✅ Created indexes on 'foods' collection");
    } else {
      console.log(`ℹ️  foods collection already has ${foodsCount} documents - skipping`);
    }

    const halalCollection = db.collection("halal_foods");
    const halalCount = await halalCollection.countDocuments();
    
    if (forceMode && halalCount > 0) {
      console.log(`🗑️  Force mode: Dropping ${halalCount} items from 'halal_foods' collection...`);
      await halalCollection.deleteMany({});
    }
    
    const shouldSeedHalal = forceMode || halalCount === 0;
    
    if (shouldSeedHalal) {
      await halalCollection.insertMany(halalFoods);
      console.log(`✅ Inserted ${halalFoods.length} items into 'halal_foods' collection`);
      await halalCollection.createIndex({ name: "text" });
      await halalCollection.createIndex({ category: 1 });
      await halalCollection.createIndex({ brand: 1 });
      await halalCollection.createIndex({ halalCertifier: 1 });
      console.log("✅ Created indexes on 'halal_foods' collection");
    } else {
      console.log(`ℹ️  halal_foods collection already has ${halalCount} documents - skipping`);
    }

    console.log("🎉 Seeding completed!");
    console.log(`📊 Data: ${naturalFoods.length} foods + ${halalFoods.length} halal certified foods`);
    
    if (forceMode) {
      console.log("⚠️  Remember to remove FORCE_SEED=true from env vars after this deploy!");
    } else {
      console.log("💡 To force reseed, set FORCE_SEED=true in environment variables");
    }
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seedSafe();
