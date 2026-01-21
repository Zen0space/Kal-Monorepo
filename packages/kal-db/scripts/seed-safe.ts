import "dotenv/config";
import { MongoClient } from "mongodb";
import Redis from "ioredis";
import { naturalFoods, halalFoods } from "./data";

/**
 * Invalidate all food-related caches in Redis after seeding
 */
async function invalidateFoodCache(): Promise<void> {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl) {
    console.log("⚠️  REDIS_URL not set - skipping cache invalidation");
    return;
  }

  console.log("🔄 Invalidating Redis cache...");

  const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });

  try {
    await redis.connect();

    // Patterns to invalidate (matching cache.ts patterns)
    const patterns = [
      "kal:api:foods:*",
      "kal:api:halal:*",
      "kal:api:stats",
      "kal:api:categories",
      "kal:trpc:food:*",
      "kal:trpc:halal:*",
      "trpc:user:stats",
      "trpc:user:growth:*",
    ];

    let totalDeleted = 0;

    for (const pattern of patterns) {
      let cursor = "0";
      do {
        const [nextCursor, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
        cursor = nextCursor;
        if (keys.length > 0) {
          await redis.del(...keys);
          totalDeleted += keys.length;
        }
      } while (cursor !== "0");
    }

    console.log(`✅ Invalidated ${totalDeleted} cache keys`);
  } catch (error) {
    console.error("⚠️  Redis cache invalidation failed:", (error as Error).message);
    console.log("   (This is non-fatal - cache will expire naturally via TTL)");
  } finally {
    await redis.quit();
  }
}

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
 * Seed script with two modes:
 * - Normal mode (default): Only adds NEW foods that don't exist in DB
 * - Force mode (FORCE_SEED=true): Drops and reseeds everything
 */
async function seedSafe() {
  const forceMode = process.env.FORCE_SEED === "true";

  if (forceMode) {
    console.log("🔥 FORCE_SEED=true detected - will drop and reseed all collections!");
  } else {
    console.log("🌱 Starting incremental seed (will add new foods only)...");
  }

  const uri = getDatabaseUri();
  const dbName = getDbName();
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db(dbName);

    // ========================================
    // Seed foods collection
    // ========================================
    const foodsCollection = db.collection("foods");
    const foodsCount = await foodsCollection.countDocuments();

    if (forceMode) {
      // Force mode: drop and reseed
      if (foodsCount > 0) {
        console.log(`🗑️  Force mode: Dropping ${foodsCount} items from 'foods' collection...`);
        await foodsCollection.deleteMany({});
      }
      await foodsCollection.insertMany(naturalFoods);
      console.log(`✅ Inserted ${naturalFoods.length} items into 'foods' collection`);
    } else if (foodsCount === 0) {
      // Empty collection: seed everything
      await foodsCollection.insertMany(naturalFoods);
      console.log(`✅ Inserted ${naturalFoods.length} items into 'foods' collection (was empty)`);
    } else {
      // Incremental mode: add only new foods
      const existingNames = await foodsCollection.distinct("name");
      const existingNamesSet = new Set(existingNames);
      const newFoods = naturalFoods.filter(food => !existingNamesSet.has(food.name));

      if (newFoods.length > 0) {
        await foodsCollection.insertMany(newFoods);
        console.log(`✅ Added ${newFoods.length} new foods (${existingNames.length} existing, ${naturalFoods.length - newFoods.length} skipped)`);
      } else {
        console.log(`ℹ️  foods collection is up to date (${existingNames.length} items, no new foods to add)`);
      }
    }

    // Create indexes for foods
    await foodsCollection.createIndex({ name: "text" });
    await foodsCollection.createIndex({ category: 1 });
    console.log("✅ Ensured indexes on 'foods' collection");

    // ========================================
    // Seed halal_foods collection
    // ========================================
    const halalCollection = db.collection("halal_foods");
    const halalCount = await halalCollection.countDocuments();

    if (forceMode) {
      // Force mode: drop and reseed
      if (halalCount > 0) {
        console.log(`🗑️  Force mode: Dropping ${halalCount} items from 'halal_foods' collection...`);
        await halalCollection.deleteMany({});
      }
      await halalCollection.insertMany(halalFoods);
      console.log(`✅ Inserted ${halalFoods.length} items into 'halal_foods' collection`);
    } else if (halalCount === 0) {
      // Empty collection: seed everything
      await halalCollection.insertMany(halalFoods);
      console.log(`✅ Inserted ${halalFoods.length} items into 'halal_foods' collection (was empty)`);
    } else {
      // Incremental mode: add only new halal foods
      const existingHalalNames = await halalCollection.distinct("name");
      const existingHalalNamesSet = new Set(existingHalalNames);
      const newHalalFoods = halalFoods.filter(food => !existingHalalNamesSet.has(food.name));

      if (newHalalFoods.length > 0) {
        await halalCollection.insertMany(newHalalFoods);
        console.log(`✅ Added ${newHalalFoods.length} new halal foods (${existingHalalNames.length} existing, ${halalFoods.length - newHalalFoods.length} skipped)`);
      } else {
        console.log(`ℹ️  halal_foods collection is up to date (${existingHalalNames.length} items, no new foods to add)`);
      }
    }

    // Create indexes for halal_foods
    await halalCollection.createIndex({ name: "text" });
    await halalCollection.createIndex({ category: 1 });
    await halalCollection.createIndex({ brand: 1 });
    await halalCollection.createIndex({ halalCertifier: 1 });
    console.log("✅ Ensured indexes on 'halal_foods' collection");

    console.log("🎉 Seeding completed!");
    console.log(`📊 Seed data: ${naturalFoods.length} foods + ${halalFoods.length} halal certified foods`);

    if (forceMode) {
      console.log("⚠️  Remember to remove FORCE_SEED=true from env vars after this deploy!");
    }

    // Invalidate Redis cache after seeding
    await invalidateFoodCache();
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seedSafe();
