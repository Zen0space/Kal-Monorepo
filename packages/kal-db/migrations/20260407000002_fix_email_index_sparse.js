/**
 * Migration: Fix email index to allow multiple null emails
 *
 * The original email_1 index was { unique: true } which prevents
 * multiple users from having email: null (e.g. social/phone login users).
 * This changes it to { unique: true, sparse: true } so null values are
 * excluded from the uniqueness constraint.
 */

export const up = async (db, client) => {
  const indexes = await db.collection("users").indexes();
  const hasEmailIndex = indexes.some((idx) => idx.key?.email === 1);

  if (hasEmailIndex) {
    // Index already exists (possibly replaced by a later migration) — skip
    console.log("✅ email index already exists, skipping sparse migration");
    return;
  }

  // Drop the old non-sparse unique index
  await db
    .collection("users")
    .dropIndex("email_1")
    .catch(() => {});

  // Recreate as sparse unique — allows multiple null emails
  await db
    .collection("users")
    .createIndex({ email: 1 }, { unique: true, sparse: true });

  console.log("✅ Recreated email index as sparse unique");
};

export const down = async (db, client) => {
  // Revert to original non-sparse unique index
  await db
    .collection("users")
    .dropIndex("email_1")
    .catch(() => {});

  await db.collection("users").createIndex({ email: 1 }, { unique: true });

  console.log("✅ Reverted email index to non-sparse unique");
};
