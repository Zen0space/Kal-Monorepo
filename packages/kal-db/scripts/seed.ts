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

async function seed() {
  console.log("🌱 Starting seed (force mode)...");

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
    const oldFoodsCollection = db.collection("foods");
    const oldCount = await oldFoodsCollection.countDocuments();

    if (oldCount > 0) {
      console.log(`📦 Found ${oldCount} items in 'foods' collection - will be replaced`);
    }

    // Clear old 'foods' collection (if exists)
    await oldFoodsCollection.deleteMany({});
    console.log("🗑️  Cleared 'foods' collection");

    // ========================================
    // Seed foods collection
    // ========================================
    const foodsCollection = db.collection("foods");
    await foodsCollection.insertMany(naturalFoods);
    console.log(`✅ Inserted ${naturalFoods.length} items into 'foods' collection`);

    // Create indexes for foods
    await foodsCollection.createIndex({ name: "text" });
    await foodsCollection.createIndex({ category: 1 });
    console.log("✅ Created indexes on 'foods' collection");

    // ========================================
    // Seed halal_foods collection
    // ========================================
    const halalCollection = db.collection("halal_foods");
    await halalCollection.deleteMany({});
    await halalCollection.insertMany(halalFoods);
    console.log(`✅ Inserted ${halalFoods.length} items into 'halal_foods' collection`);

    // Create indexes for halal_foods
    await halalCollection.createIndex({ name: "text" });
    await halalCollection.createIndex({ category: 1 });
    await halalCollection.createIndex({ brand: 1 });
    await halalCollection.createIndex({ halalCertifier: 1 });
    console.log("✅ Created indexes on 'halal_foods' collection");

    console.log("🎉 Seeding completed successfully!");
    console.log(`   📊 Total: ${naturalFoods.length} foods + ${halalFoods.length} halal certified foods`);

    // Invalidate Redis cache after seeding
    await invalidateFoodCache();
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seed();
