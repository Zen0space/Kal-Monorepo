import { getRedis, isRedisAvailable } from "./redis.js";
import { logger } from "./logger.js";

/**
 * Cache service providing high-level caching operations
 * Gracefully degrades when Redis is unavailable
 */
export const cache = {
  /**
   * Get a value from cache
   * Returns null if not found or Redis unavailable
   */
  async get<T>(key: string): Promise<T | null> {
    if (!isRedisAvailable()) {
      return null;
    }

    try {
      const redis = getRedis();
      if (!redis) return null;

      const value = await redis.get(key);
      if (!value) {
        return null;
      }

      return JSON.parse(value) as T;
    } catch (error) {
      logger.error(`Cache get error for key ${key}: ${(error as Error).message}`);
      return null;
    }
  },

  /**
   * Set a value in cache with TTL
   */
  async set(key: string, value: unknown, ttlSeconds: number): Promise<boolean> {
    if (!isRedisAvailable()) {
      return false;
    }

    try {
      const redis = getRedis();
      if (!redis) return false;

      const serialized = JSON.stringify(value);
      await redis.setex(key, ttlSeconds, serialized);
      return true;
    } catch (error) {
      logger.error(`Cache set error for key ${key}: ${(error as Error).message}`);
      return false;
    }
  },

  /**
   * Delete a single key from cache
   */
  async del(key: string): Promise<boolean> {
    if (!isRedisAvailable()) {
      return false;
    }

    try {
      const redis = getRedis();
      if (!redis) return false;

      await redis.del(key);
      return true;
    } catch (error) {
      logger.error(`Cache del error for key ${key}: ${(error as Error).message}`);
      return false;
    }
  },

  /**
   * Delete keys matching a pattern
   * Use with caution - SCAN is O(N)
   */
  async delPattern(pattern: string): Promise<number> {
    if (!isRedisAvailable()) {
      return 0;
    }

    try {
      const redis = getRedis();
      if (!redis) return 0;

      let cursor = "0";
      let deletedCount = 0;

      do {
        const [nextCursor, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
        cursor = nextCursor;

        if (keys.length > 0) {
          await redis.del(...keys);
          deletedCount += keys.length;
        }
      } while (cursor !== "0");

      if (deletedCount > 0) {
        logger.info(`Cache invalidated ${deletedCount} keys matching pattern: ${pattern}`);
      }

      return deletedCount;
    } catch (error) {
      logger.error(`Cache delPattern error for pattern ${pattern}: ${(error as Error).message}`);
      return 0;
    }
  },

  /**
   * Cache-aside pattern helper
   * Tries to get from cache, falls back to fetch function on miss
   */
  async wrap<T>(
    key: string,
    ttlSeconds: number,
    fetchFn: () => Promise<T>
  ): Promise<T> {
    // Try cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      logger.debug(`Cache HIT: ${key}`);
      return cached;
    }

    // Cache miss - fetch from source
    logger.debug(`Cache MISS: ${key}`);
    const value = await fetchFn();

    // Store in cache (fire and forget)
    this.set(key, value, ttlSeconds).catch(() => {
      // Ignore cache set errors
    });

    return value;
  },

  /**
   * Check if a key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    if (!isRedisAvailable()) {
      return false;
    }

    try {
      const redis = getRedis();
      if (!redis) return false;

      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`Cache exists error for key ${key}: ${(error as Error).message}`);
      return false;
    }
  },

  /**
   * Get TTL (time to live) for a key in seconds
   * Returns -2 if key doesn't exist, -1 if no TTL set
   */
  async ttl(key: string): Promise<number> {
    if (!isRedisAvailable()) {
      return -2;
    }

    try {
      const redis = getRedis();
      if (!redis) return -2;

      return await redis.ttl(key);
    } catch (error) {
      logger.error(`Cache ttl error for key ${key}: ${(error as Error).message}`);
      return -2;
    }
  },
};

/**
 * Cache invalidation helpers
 * Call these when data changes to ensure cache consistency
 */
export const invalidateCache = {
  /**
   * Invalidate all food-related caches
   * Call when food database is updated
   */
  async foods(): Promise<void> {
    await Promise.all([
      cache.delPattern("kal:api:foods:*"),
      cache.delPattern("kal:trpc:food:*"),
      cache.del("kal:api:stats"),
      cache.del("kal:trpc:food:stats"),
    ]);
  },

  /**
   * Invalidate all halal food caches
   * Call when halal database is updated
   */
  async halal(): Promise<void> {
    await Promise.all([
      cache.delPattern("kal:api:halal:*"),
      cache.delPattern("kal:trpc:halal:*"),
      cache.del("kal:api:stats"),
      cache.del("kal:trpc:food:stats"),
    ]);
  },

  /**
   * Invalidate user-specific food entry caches
   * Call when user creates/deletes food entries
   */
  async userFoodEntries(userId: string): Promise<void> {
    await cache.delPattern(`kal:user:${userId}:food:*`);
  },

  /**
   * Invalidate all stats caches
   */
  async stats(): Promise<void> {
    await Promise.all([
      cache.del("kal:api:stats"),
      cache.del("kal:trpc:food:stats"),
    ]);
  },

  /**
   * Invalidate everything (nuclear option)
   * Use sparingly - only for major data migrations
   */
  async all(): Promise<void> {
    await cache.delPattern("kal:*");
  },
};
