/**
 * Migration: Create api_request_logs collection
 * 
 * Creates the api_request_logs collection with indexes for:
 * - TTL auto-expiration (90 days)
 * - User activity queries
 * - Endpoint analytics
 * - Error tracking
 */

export const up = async (db, _client) => {
  // Create api_request_logs collection
  const collections = await db.listCollections({ name: "api_request_logs" }).toArray();
  if (collections.length === 0) {
    await db.createCollection("api_request_logs");
    console.log("✅ Created api_request_logs collection");
  } else {
    console.log("ℹ️  api_request_logs collection already exists");
  }

  // TTL index - auto-delete logs after 90 days (7776000 seconds)
  await db.collection("api_request_logs").createIndex(
    { timestamp: 1 },
    { expireAfterSeconds: 7776000, name: "ttl_90_days" }
  );
  console.log("✅ Created TTL index (90 days expiration)");

  // Index for user activity queries
  await db.collection("api_request_logs").createIndex(
    { userId: 1, timestamp: -1 },
    { name: "user_activity" }
  );
  console.log("✅ Created user_activity index");

  // Index for endpoint analytics
  await db.collection("api_request_logs").createIndex(
    { endpoint: 1, timestamp: -1 },
    { name: "endpoint_analytics" }
  );
  console.log("✅ Created endpoint_analytics index");

  // Index for error tracking
  await db.collection("api_request_logs").createIndex(
    { statusCode: 1, timestamp: -1 },
    { name: "status_tracking" }
  );
  console.log("✅ Created status_tracking index");

  // Index for request type filtering (REST vs tRPC)
  await db.collection("api_request_logs").createIndex(
    { type: 1, timestamp: -1 },
    { name: "type_filter" }
  );
  console.log("✅ Created type_filter index");

  // Compound index for common query patterns
  await db.collection("api_request_logs").createIndex(
    { type: 1, endpoint: 1, timestamp: -1 },
    { name: "type_endpoint_time" }
  );
  console.log("✅ Created type_endpoint_time compound index");
};

export const down = async (db, _client) => {
  try {
    await db.collection("api_request_logs").drop();
    console.log("✅ Dropped api_request_logs collection");
  } catch (e) {
    console.log("ℹ️  api_request_logs collection may not exist, skipping drop");
  }
};
