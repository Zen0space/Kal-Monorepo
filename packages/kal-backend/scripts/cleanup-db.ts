/**
 * Database Cleanup Script
 * 
 * Fixes database issues:
 * 1. Removes corrupt rate_limit_usage documents with _id: ""
 * 2. Fixes the users collection indexes (drops unique email, ensures unique logtoId)
 * 3. Sets empty email strings to null
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
    
    // ========================================
    // 1. Fix users collection indexes
    // ========================================
    console.log("\n🔧 Fixing users collection indexes...");
    
    const usersCollection = db.collection("users");
    
    // Check existing indexes
    const indexes = await usersCollection.indexes();
    console.log(`   Found ${indexes.length} index(es)`);
    
    // Drop the email_1 unique index if it exists
    const emailIndex = indexes.find(idx => idx.name === "email_1");
    if (emailIndex) {
      console.log("   ⚠️  Found unique email_1 index - dropping it...");
      try {
        await usersCollection.dropIndex("email_1");
        console.log("   ✅ Dropped email_1 unique index");
      } catch (e) {
        console.log("   ⚠️  Could not drop email_1 index:", (e as Error).message);
      }
    } else {
      console.log("   ✅ No problematic email_1 index found");
    }
    
    // Ensure logtoId has a unique index
    const logtoIdIndex = indexes.find(idx => idx.key && (idx.key as Record<string, number>).logtoId);
    if (!logtoIdIndex) {
      console.log("   Creating unique index on logtoId...");
      await usersCollection.createIndex({ logtoId: 1 }, { unique: true, sparse: true });
      console.log("   ✅ Created unique index on logtoId");
    } else {
      console.log("   ✅ logtoId index already exists");
    }
    
    // Fix users with empty email strings (set to null)
    const emptyEmailResult = await usersCollection.updateMany(
      { email: "" },
      { $set: { email: null } }
    );
    if (emptyEmailResult.modifiedCount > 0) {
      console.log(`   ✅ Fixed ${emptyEmailResult.modifiedCount} user(s) with empty email`);
    } else {
      console.log("   ✅ No users with empty email strings");
    }
    
    // ========================================
    // 2. Clean up rate_limit_usage documents
    // ========================================
    console.log("\n🧹 Cleaning up rate_limit_usage collection...");
    
    const rateLimitCollection = db.collection("rate_limit_usage");
    
    // Find corrupt documents
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const corruptDocs = await rateLimitCollection.find({ _id: "" as unknown as any }).toArray();
    
    if (corruptDocs.length > 0) {
      console.log(`   Found ${corruptDocs.length} corrupt document(s) with _id: ""`);
      
      // Delete corrupt documents
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const deleteResult = await rateLimitCollection.deleteMany({ _id: "" as unknown as any });
      console.log(`   ✅ Deleted ${deleteResult.deletedCount} corrupt document(s)`);
    } else {
      console.log("   ✅ No corrupt documents found");
    }
    
    // ========================================
    // 3. Show current stats
    // ========================================
    console.log("\n📊 Collection Statistics:");
    
    const totalUsers = await usersCollection.countDocuments();
    console.log(`   users: ${totalUsers} document(s)`);
    
    const totalRateLimit = await rateLimitCollection.countDocuments();
    console.log(`   rate_limit_usage: ${totalRateLimit} document(s)`);
    
    // Show current users indexes
    const finalIndexes = await usersCollection.indexes();
    console.log("\n   Users collection indexes:");
    finalIndexes.forEach((idx, i) => {
      const unique = idx.unique ? " (unique)" : "";
      const sparse = idx.sparse ? " (sparse)" : "";
      console.log(`   ${i + 1}. ${idx.name}${unique}${sparse}`);
    });
    
    console.log("\n" + "─".repeat(50));
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

