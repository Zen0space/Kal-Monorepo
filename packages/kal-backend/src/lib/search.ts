/**
 * Search utility for flexible, order-independent text matching.
 *
 * Industry-standard approach:
 * - Tokenizes query into individual words
 * - Builds regex that matches ALL words in ANY order
 * - Case-insensitive matching
 * - Filters out common stop words and short tokens
 *
 * Example: "ramly burger beef" will match "ramly beef burger"
 * because all three words are present regardless of order.
 */

// Common stop words to filter out (can be expanded)
const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "with",
  "is",
  "it",
]);

// Minimum word length to include in search
const MIN_WORD_LENGTH = 2;

/**
 * Escapes special regex characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Tokenizes a search query into meaningful words
 * - Converts to lowercase
 * - Splits on whitespace and common delimiters
 * - Filters out stop words and short tokens
 * - Removes duplicates
 */
export function tokenizeQuery(query: string): string[] {
  const tokens = query
    .toLowerCase()
    .split(/[\s,\-_]+/) // Split on whitespace, commas, hyphens, underscores
    .map((token) => token.trim())
    .filter(
      (token) =>
        token.length >= MIN_WORD_LENGTH && !STOP_WORDS.has(token.toLowerCase())
    );

  // Remove duplicates while preserving order
  return [...new Set(tokens)];
}

/**
 * Builds a MongoDB query for flexible text search.
 *
 * Uses regex lookahead assertions to match all words in any order.
 * Pattern: (?=.*word1)(?=.*word2)(?=.*word3).*
 *
 * This is a standard approach used by many search implementations.
 *
 * @param query - The search query string
 * @param field - The field name to search on (default: "name")
 * @returns MongoDB query object
 */
export function buildSearchQuery(
  query: string,
  field: string = "name"
): Record<string, unknown> {
  const tokens = tokenizeQuery(query);

  if (tokens.length === 0) {
    // If no valid tokens, fall back to simple substring match
    return { [field]: { $regex: escapeRegex(query.trim()), $options: "i" } };
  }

  if (tokens.length === 1) {
    // Single token - simple substring match
    return { [field]: { $regex: escapeRegex(tokens[0]), $options: "i" } };
  }

  // Multiple tokens - use lookahead assertions for order-independent matching
  // Pattern: (?=.*token1)(?=.*token2)... matches if all tokens are present
  const lookaheads = tokens.map((token) => `(?=.*${escapeRegex(token)})`).join("");
  const pattern = `${lookaheads}.*`;

  return { [field]: { $regex: pattern, $options: "i" } };
}

/**
 * Alternative: Build MongoDB $and query with multiple regex conditions.
 * This can be more efficient for some databases as it can use indexes better.
 *
 * @param query - The search query string
 * @param field - The field name to search on (default: "name")
 * @returns MongoDB query object with $and conditions
 */
export function buildSearchQueryWithAnd(
  query: string,
  field: string = "name"
): Record<string, unknown> {
  const tokens = tokenizeQuery(query);

  if (tokens.length === 0) {
    return { [field]: { $regex: escapeRegex(query.trim()), $options: "i" } };
  }

  if (tokens.length === 1) {
    return { [field]: { $regex: escapeRegex(tokens[0]), $options: "i" } };
  }

  // Use $and with multiple regex conditions
  return {
    $and: tokens.map((token) => ({
      [field]: { $regex: escapeRegex(token), $options: "i" },
    })),
  };
}
