import { createHash } from "crypto";

/**
 * Hash a string for use in cache keys (for long queries)
 */
function hashKey(input: string): string {
  return createHash("md5").update(input).digest("hex").slice(0, 12);
}

/**
 * Cache key prefix for namespacing
 */
const PREFIX = "kal";

/**
 * Centralized cache key generation
 * Ensures consistent key patterns across the application
 */
export const CacheKeys = {
  // ============================================
  // REST API - Natural Foods
  // ============================================
  foodSearch: (query: string): string =>
    `${PREFIX}:api:foods:search:${hashKey(query.toLowerCase().trim())}`,

  foodList: (category: string | null, limit: number, offset: number): string =>
    `${PREFIX}:api:foods:list:${category || "all"}:${limit}:${offset}`,

  foodById: (id: string): string =>
    `${PREFIX}:api:foods:id:${id}`,

  categories: (): string =>
    `${PREFIX}:api:categories`,

  // ============================================
  // REST API - Halal Foods
  // ============================================
  halalSearch: (query: string): string =>
    `${PREFIX}:api:halal:search:${hashKey(query.toLowerCase().trim())}`,

  halalList: (brand: string | null, category: string | null, limit: number, offset: number): string =>
    `${PREFIX}:api:halal:list:${brand || "all"}:${category || "all"}:${limit}:${offset}`,

  halalById: (id: string): string =>
    `${PREFIX}:api:halal:id:${id}`,

  halalBrands: (query: string | null, withCount: boolean): string =>
    `${PREFIX}:api:halal:brands:${query ? hashKey(query.toLowerCase()) : "all"}:${withCount}`,

  // ============================================
  // REST API - Stats
  // ============================================
  stats: (): string =>
    `${PREFIX}:api:stats`,

  // ============================================
  // tRPC - Food procedures
  // ============================================
  trpcFoodSearch: (query: string): string =>
    `${PREFIX}:trpc:food:search:${hashKey(query.toLowerCase().trim())}`,

  trpcFoodAll: (): string =>
    `${PREFIX}:trpc:food:all`,

  trpcFoodPaginated: (cursor: number, limit: number, category: string | null): string =>
    `${PREFIX}:trpc:food:paginated:${cursor}:${limit}:${category || "all"}`,

  trpcFoodCategories: (): string =>
    `${PREFIX}:trpc:food:categories`,

  trpcFoodStats: (): string =>
    `${PREFIX}:trpc:food:stats`,

  // ============================================
  // tRPC - Halal procedures
  // ============================================
  trpcHalalSearch: (query: string): string =>
    `${PREFIX}:trpc:halal:search:${hashKey(query.toLowerCase().trim())}`,

  trpcHalalAll: (): string =>
    `${PREFIX}:trpc:halal:all`,

  trpcHalalPaginated: (cursor: number, limit: number, brand: string | null, category: string | null): string =>
    `${PREFIX}:trpc:halal:paginated:${cursor}:${limit}:${brand || "all"}:${category || "all"}`,

  trpcHalalBrands: (): string =>
    `${PREFIX}:trpc:halal:brands`,

  trpcHalalCategories: (): string =>
    `${PREFIX}:trpc:halal:categories`,

  trpcHalalByBrand: (brand: string): string =>
    `${PREFIX}:trpc:halal:brand:${hashKey(brand.toLowerCase())}`,

  // ============================================
  // User-specific cache keys
  // ============================================
  userFoodToday: (userId: string, date: string): string =>
    `${PREFIX}:user:${userId}:food:today:${date}`,

  userFoodTotal: (userId: string, date: string): string =>
    `${PREFIX}:user:${userId}:food:total:${date}`,

  // ============================================
  // Invalidation patterns (for delPattern)
  // ============================================
  patterns: {
    allFoods: (): string => `${PREFIX}:*:food*`,
    allHalal: (): string => `${PREFIX}:*:halal*`,
    allStats: (): string => `${PREFIX}:*:stats`,
    userFood: (userId: string): string => `${PREFIX}:user:${userId}:food:*`,
    apiSearches: (): string => `${PREFIX}:api:*:search:*`,
  },
};

/**
 * TTL values in seconds
 */
export const CacheTTL = {
  // Short-lived (frequently changing)
  USER_DATA: 120,           // 2 minutes
  SEARCH_RESULTS: 300,      // 5 minutes

  // Medium-lived
  LIST_RESULTS: 600,        // 10 minutes
  STATS: 900,               // 15 minutes

  // Long-lived (rarely changing)
  CATEGORIES: 3600,         // 1 hour
  BRANDS: 3600,             // 1 hour
  SINGLE_ITEM: 1800,        // 30 minutes
};
