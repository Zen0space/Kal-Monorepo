/**
 * Database Cleanup Script
 * 
 * Removes corrupt documents from the rate_limit_usage collection:
 * - Documents with _id: "" (empty string) caused by a bug in the rate limiting code
 * 
 * Run with: pnpm --filter kal-backend cleanup-db
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

async function cleanup() {
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
    
    // 1. Clean up rate_limit_usage documents with empty _id
    console.log("\n🧹 Cleaning up rate_limit_usage collection...");
    
    const rateLimitCollection = db.collection("rate_limit_usage");
    
    // Find corrupt documents
    const corruptDocs = await rateLimitCollection.find({ _id: "" as unknown as any }).toArray();
    
    if (corruptDocs.length > 0) {
      console.log(`   Found ${corruptDocs.length} corrupt document(s) with _id: ""`);
      
      // Delete corrupt documents
      const deleteResult = await rateLimitCollection.deleteMany({ _id: "" as unknown as any });
      console.log(`   ✅ Deleted ${deleteResult.deletedCount} corrupt document(s)`);
    } else {
      console.log("   ✅ No corrupt documents found");
    }
    
    // 2. Show current collection stats
    console.log("\n📊 Collection Statistics:");
    const totalDocs = await rateLimitCollection.countDocuments();
    console.log(`   rate_limit_usage: ${totalDocs} document(s)`);
    
    // Show sample of valid documents
    const sampleDocs = await rateLimitCollection.find().limit(5).toArray();
    if (sampleDocs.length > 0) {
      console.log("\n   Sample documents:");
      sampleDocs.forEach((doc, i) => {
        console.log(`   ${i + 1}. _id: "${doc._id}", dailyCount: ${doc.dailyCount}, date: ${doc.date}`);
      });
    }
    
    console.log("\n─".repeat(50));
    console.log("✅ Database cleanup complete!\n");
    
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
    process.exit(1);
  } finally {
    await client.close();
    console.log("🔌 Disconnected from MongoDB");
  }
}

cleanup();
