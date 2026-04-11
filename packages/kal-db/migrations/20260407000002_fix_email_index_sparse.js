/**
 * Migration: Fix email index to allow multiple null emails
 *
 * SUPERSEDED by 20260407000003_fix_email_index_partial.js which uses
 * partialFilterExpression instead of sparse. This migration is now a
 * no-op — it exists only so migrate-mongo records it in the changelog
 * and stops retrying it on every deploy.
 */

export const up = async (db, client) => {
  console.log("✅ email sparse migration skipped (superseded by 000003 partial filter)");
};

export const down = async (db, client) => {
  // Nothing to revert — this migration is a no-op
};
