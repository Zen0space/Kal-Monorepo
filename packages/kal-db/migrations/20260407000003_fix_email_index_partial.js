/**
 * Migration: Fix email index using partialFilterExpression
 *
 * The previous sparse:true fix doesn't actually work because MongoDB sparse
 * indexes still include documents where the field is explicitly set to null.
 * Sparse only skips documents where the field is completely absent.
 *
 * This replaces the index with a partialFilterExpression that only indexes
 * documents where email is a string — completely excluding null/missing values
 * from the uniqueness constraint.
 */

export const up = async (db, client) => {
  // Drop the current sparse unique index
  await db
    .collection("users")
    .dropIndex("email_1")
    .catch(() => {});

  // Recreate with partialFilterExpression — only enforce uniqueness on actual string emails
  await db.collection("users").createIndex(
    { email: 1 },
    {
      unique: true,
      partialFilterExpression: { email: { $type: "string" } },
    }
  );

  console.log(
    "✅ Recreated email index with partialFilterExpression (string only)"
  );
};

export const down = async (db, client) => {
  // Revert to the sparse unique index from the previous migration
  await db
    .collection("users")
    .dropIndex("email_1")
    .catch(() => {});

  await db
    .collection("users")
    .createIndex({ email: 1 }, { unique: true, sparse: true });

  console.log("✅ Reverted email index to sparse unique");
};
