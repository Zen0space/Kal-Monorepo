/**
 * Feedback Collections Migration Script
 * 
 * Creates collections and indexes for:
 * 1. feedback_reviews - User reviews with star ratings
 * 2. feedback_bugs - Bug reports submitted by users
 * 
 * Run with: pnpm --filter kal-backend migrate-feedback
 */

import "dotenv/config";
import { MongoClient } from "mongodb";

// Support both individual env vars and a full DATABASE_URL
function getDatabaseUri(): string {
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
}

async function migrate() {
  const uri = getDatabaseUri();
  console.log("🔌 Connecting to MongoDB...");
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");
    
    const dbName = process.env.MONGODB_DATABASE || new URL(uri).pathname.slice(1).split("?")[0];
    const db = client.db(dbName);
    
    console.log(`\n📂 Using database: ${dbName}`);
    console.log("─".repeat(50));
    
    // ========================================
    // 1. Create feedback_reviews collection
    // ========================================
    console.log("\n📝 Setting up feedback_reviews collection...");
    
    const reviewsCollection = db.collection("feedback_reviews");
    
    // Create indexes for reviews (simple - no status needed)
    await reviewsCollection.createIndex({ userId: 1 });
    console.log("   ✅ Created index on userId");
    
    await reviewsCollection.createIndex({ createdAt: -1 });
    console.log("   ✅ Created index on createdAt (descending)");
    
    await reviewsCollection.createIndex({ rating: 1 });
    console.log("   ✅ Created index on rating");
    
    // ========================================
    // 2. Create feedback_bugs collection
    // ========================================
    console.log("\n🐛 Setting up feedback_bugs collection...");
    
    const bugsCollection = db.collection("feedback_bugs");
    
    // Create indexes for bug reports (priority set internally, not by user)
    await bugsCollection.createIndex({ userId: 1 });
    console.log("   ✅ Created index on userId");
    
    await bugsCollection.createIndex({ createdAt: -1 });
    console.log("   ✅ Created index on createdAt (descending)");
    
    await bugsCollection.createIndex({ status: 1 });
    console.log("   ✅ Created index on status");
    
    // Compound index for admin queries (status + createdAt is enough for now)
    await bugsCollection.createIndex({ status: 1, createdAt: -1 });
    console.log("   ✅ Created compound index for admin queries");
    
    // ========================================
    // 3. Show collection stats
    // ========================================
    console.log("\n📊 Collection Statistics:");
    
    const reviewCount = await reviewsCollection.countDocuments();
    console.log(`   feedback_reviews: ${reviewCount} document(s)`);
    
    const bugCount = await bugsCollection.countDocuments();
    console.log(`   feedback_bugs: ${bugCount} document(s)`);
    
    // Show indexes
    console.log("\n   feedback_reviews indexes:");
    const reviewIndexes = await reviewsCollection.indexes();
    reviewIndexes.forEach((idx, i) => {
      console.log(`   ${i + 1}. ${idx.name}`);
    });
    
    console.log("\n   feedback_bugs indexes:");
    const bugIndexes = await bugsCollection.indexes();
    bugIndexes.forEach((idx, i) => {
      console.log(`   ${i + 1}. ${idx.name}`);
    });
    
    console.log("\n" + "─".repeat(50));
    console.log("✅ Feedback migration complete!\n");
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await client.close();
    console.log("🔌 Disconnected from MongoDB");
  }
}

migrate();
