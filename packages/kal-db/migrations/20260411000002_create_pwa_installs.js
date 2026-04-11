/**
 * Migration: Create pwa_installs collection
 *
 * Tracks when users install the PWA (add to home screen).
 * Captures platform, browser, and device info for analytics.
 * Uses a fingerprint field to deduplicate installs from the same device.
 *
 * Indexes:
 * - fingerprint_unique: prevent duplicate installs from the same device
 * - user_id: find installs by user (nullable — anonymous installs allowed)
 * - installed_at_desc: chronological queries / recent installs
 * - platform: filter/aggregate by platform (ios, android, desktop)
 */

export const up = async (db, _client) => {
  // Create pwa_installs collection
  const collections = await db
    .listCollections({ name: "pwa_installs" })
    .toArray();
  if (collections.length === 0) {
    await db.createCollection("pwa_installs");
    console.log("✅ Created pwa_installs collection");
  } else {
    console.log("ℹ️  pwa_installs collection already exists");
  }

  // Unique index on fingerprint — deduplicate same-device installs
  await db
    .collection("pwa_installs")
    .createIndex(
      { fingerprint: 1 },
      { unique: true, name: "fingerprint_unique" }
    );
  console.log("✅ Created fingerprint_unique index");

  // Index for finding installs by user
  await db
    .collection("pwa_installs")
    .createIndex({ userId: 1 }, { name: "user_id" });
  console.log("✅ Created user_id index");

  // Index for chronological queries (newest first)
  await db
    .collection("pwa_installs")
    .createIndex({ installedAt: -1 }, { name: "installed_at_desc" });
  console.log("✅ Created installed_at_desc index");

  // Index for platform breakdown queries
  await db
    .collection("pwa_installs")
    .createIndex({ platform: 1 }, { name: "platform" });
  console.log("✅ Created platform index");
};

export const down = async (db, _client) => {
  try {
    await db.collection("pwa_installs").drop();
    console.log("✅ Dropped pwa_installs collection");
  } catch (e) {
    console.log("ℹ️  pwa_installs collection may not exist, skipping drop");
  }
};
