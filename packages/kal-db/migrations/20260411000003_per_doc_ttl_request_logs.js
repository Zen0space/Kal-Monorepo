/**
 * Migration: Per-document TTL for api_request_logs
 *
 * Replaces the fixed 90-day TTL index on `timestamp` with a TTL index
 * on `expiresAt` (expireAfterSeconds: 0). Each document sets its own
 * expiration:
 *   - 429 rate-limited requests: 30 days
 *   - All other requests: 90 days
 *
 * This reduces storage for abusive/rate-limited traffic while keeping
 * normal request logs for the full 90-day window.
 */

export const up = async (db, _client) => {
  const col = db.collection("api_request_logs");

  // Drop the old fixed-TTL index on timestamp
  await col.dropIndex("ttl_90_days").catch(() => {
    console.log("ℹ️  ttl_90_days index not found, skipping drop");
  });
  console.log("✅ Dropped old ttl_90_days index");

  // Create new TTL index on expiresAt (expireAfterSeconds: 0 means
  // "delete when the expiresAt date is reached")
  await col.createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: 0, name: "ttl_per_doc" }
  );
  console.log("✅ Created per-document TTL index on expiresAt");

  // Backfill expiresAt for existing documents that don't have it yet
  // 429 requests get 30 days from their timestamp, others get 90 days
  const TTL_SUCCESS_S = 90 * 24 * 60 * 60;
  const TTL_RATE_LIMITED_S = 30 * 24 * 60 * 60;

  // Rate-limited docs (statusCode 429)
  const rateLimitedResult = await col.updateMany(
    { statusCode: 429, expiresAt: { $exists: false } },
    [
      {
        $set: {
          expiresAt: {
            $dateAdd: { startDate: "$timestamp", unit: "second", amount: TTL_RATE_LIMITED_S },
          },
        },
      },
    ]
  );
  console.log(`✅ Backfilled ${rateLimitedResult.modifiedCount} rate-limited docs (30-day TTL)`);

  // All other docs
  const successResult = await col.updateMany(
    { statusCode: { $ne: 429 }, expiresAt: { $exists: false } },
    [
      {
        $set: {
          expiresAt: {
            $dateAdd: { startDate: "$timestamp", unit: "second", amount: TTL_SUCCESS_S },
          },
        },
      },
    ]
  );
  console.log(`✅ Backfilled ${successResult.modifiedCount} normal docs (90-day TTL)`);
};

export const down = async (db, _client) => {
  const col = db.collection("api_request_logs");

  // Drop per-doc TTL index
  await col.dropIndex("ttl_per_doc").catch(() => {});

  // Restore the original fixed 90-day TTL on timestamp
  await col.createIndex(
    { timestamp: 1 },
    { expireAfterSeconds: 7776000, name: "ttl_90_days" }
  );
  console.log("✅ Restored fixed 90-day TTL index on timestamp");
};
