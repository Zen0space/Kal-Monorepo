/**
 * Migration: Fix stripeCustomerId index using partialFilterExpression
 *
 * Safety net for environments where migration 000001 partially applied —
 * the updateMany set stripeCustomerId: null on all users, but the
 * createIndex with { sparse: true, unique: true } failed because sparse
 * indexes still include documents where the field is explicitly null.
 *
 * This drops any existing stripeCustomerId index and recreates it with
 * a partialFilterExpression that only indexes documents where
 * stripeCustomerId is a string — completely excluding null/missing values
 * from the uniqueness constraint.
 */

export const up = async (db, client) => {
  // Drop the existing index if it exists (may be sparse or broken)
  await db
    .collection("users")
    .dropIndex("stripeCustomerId_1")
    .catch(() => {});

  // Recreate with partialFilterExpression — only enforce uniqueness on real Stripe IDs
  await db.collection("users").createIndex(
    { stripeCustomerId: 1 },
    {
      unique: true,
      partialFilterExpression: { stripeCustomerId: { $type: "string" } },
    }
  );

  console.log(
    "✅ Recreated stripeCustomerId index with partialFilterExpression (string only)"
  );
};

export const down = async (db, client) => {
  // Revert to the sparse unique index from the original migration
  await db
    .collection("users")
    .dropIndex("stripeCustomerId_1")
    .catch(() => {});

  await db
    .collection("users")
    .createIndex({ stripeCustomerId: 1 }, { sparse: true, unique: true });

  console.log("✅ Reverted stripeCustomerId index to sparse unique");
};
