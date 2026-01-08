import type { Request, Response, NextFunction } from "express";

import { cache } from "../lib/cache.js";
import { isRedisAvailable } from "../lib/redis.js";
import { logger } from "../lib/logger.js";
import { CacheKeys, CacheTTL } from "../lib/cache-keys.js";

/**
 * Response wrapper to capture response body for caching
 */
interface CacheableResponse extends Response {
  __cacheBody?: string;
}

/**
 * Route-specific cache configuration
 */
interface CacheConfig {
  keyGenerator: (req: Request) => string;
  ttl: number;
}

/**
 * Cache configurations for different API routes
 */
const routeCacheConfigs: Record<string, CacheConfig> = {
  // Food routes
  "GET:/api/foods/search": {
    keyGenerator: (req) => CacheKeys.foodSearch(req.query.q as string || ""),
    ttl: CacheTTL.SEARCH_RESULTS,
  },
  "GET:/api/foods": {
    keyGenerator: (req) => CacheKeys.foodList(
      req.query.category as string || null,
      parseInt(req.query.limit as string) || 50,
      parseInt(req.query.offset as string) || 0
    ),
    ttl: CacheTTL.LIST_RESULTS,
  },
  "GET:/api/foods/:id": {
    keyGenerator: (req) => CacheKeys.foodById(req.params.id),
    ttl: CacheTTL.SINGLE_ITEM,
  },
  "GET:/api/categories": {
    keyGenerator: () => CacheKeys.categories(),
    ttl: CacheTTL.CATEGORIES,
  },

  // Halal routes
  "GET:/api/halal/search": {
    keyGenerator: (req) => CacheKeys.halalSearch(req.query.q as string || ""),
    ttl: CacheTTL.SEARCH_RESULTS,
  },
  "GET:/api/halal": {
    keyGenerator: (req) => CacheKeys.halalList(
      req.query.brand as string || null,
      req.query.category as string || null,
      parseInt(req.query.limit as string) || 50,
      parseInt(req.query.offset as string) || 0
    ),
    ttl: CacheTTL.LIST_RESULTS,
  },
  "GET:/api/halal/brands": {
    keyGenerator: (req) => CacheKeys.halalBrands(
      req.query.q as string || null,
      req.query.withCount === "true"
    ),
    ttl: CacheTTL.BRANDS,
  },
  "GET:/api/halal/:id": {
    keyGenerator: (req) => CacheKeys.halalById(req.params.id),
    ttl: CacheTTL.SINGLE_ITEM,
  },

  // Stats
  "GET:/api/stats": {
    keyGenerator: () => CacheKeys.stats(),
    ttl: CacheTTL.STATS,
  },
};

/**
 * Get route pattern from request path
 * Handles parameterized routes like /api/foods/:id
 */
function getRoutePattern(method: string, path: string): string {
  // Remove query string
  const cleanPath = path.split("?")[0];

  // Check for exact matches first
  const exactKey = `${method}:${cleanPath}`;
  if (routeCacheConfigs[exactKey]) {
    return exactKey;
  }

  // Check for parameterized routes
  // /api/foods/123 -> /api/foods/:id
  // /api/halal/456 -> /api/halal/:id
  const foodIdMatch = cleanPath.match(/^\/api\/foods\/([a-f0-9]{24})$/i);
  if (foodIdMatch) {
    return `${method}:/api/foods/:id`;
  }

  const halalIdMatch = cleanPath.match(/^\/api\/halal\/([a-f0-9]{24})$/i);
  if (halalIdMatch) {
    return `${method}:/api/halal/:id`;
  }

  return exactKey;
}

/**
 * API response caching middleware
 * Automatically caches GET responses based on route configuration
 */
export function apiCacheMiddleware(req: Request, res: CacheableResponse, next: NextFunction): void {
  // Only cache GET requests
  if (req.method !== "GET") {
    next();
    return;
  }

  // Skip if Redis is not available
  if (!isRedisAvailable()) {
    next();
    return;
  }

  const routePattern = getRoutePattern(req.method, req.path);
  const config = routeCacheConfigs[routePattern];

  // Skip if route is not configured for caching
  if (!config) {
    next();
    return;
  }

  const cacheKey = config.keyGenerator(req);

  // Try to get from cache
  cache.get<{ body: string; contentType: string }>(cacheKey)
    .then((cached) => {
      if (cached) {
        // Cache hit
        res.setHeader("X-Cache", "HIT");
        res.setHeader("X-Cache-Key", cacheKey);
        res.setHeader("Content-Type", cached.contentType || "application/json");
        res.send(cached.body);
        logger.debug(`Cache HIT: ${cacheKey}`);
        return;
      }

      // Cache miss - capture response
      res.setHeader("X-Cache", "MISS");
      res.setHeader("X-Cache-Key", cacheKey);

      // Store original methods
      const originalJson = res.json.bind(res);
      const originalSend = res.send.bind(res);

      // Override json method to capture response
      res.json = function (body: unknown): Response {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const bodyString = JSON.stringify(body);
          cache.set(cacheKey, {
            body: bodyString,
            contentType: "application/json",
          }, config.ttl).catch(() => {
            // Ignore cache errors
          });
          logger.debug(`Cache SET: ${cacheKey} (TTL: ${config.ttl}s)`);
        }
        return originalJson(body);
      };

      // Override send method for non-JSON responses
      res.send = function (body: unknown): Response {
        if (res.statusCode >= 200 && res.statusCode < 300 && typeof body === "string") {
          cache.set(cacheKey, {
            body,
            contentType: res.get("Content-Type") || "text/plain",
          }, config.ttl).catch(() => {
            // Ignore cache errors
          });
        }
        return originalSend(body);
      };

      next();
    })
    .catch((error) => {
      logger.error(`Cache middleware error: ${(error as Error).message}`);
      next();
    });
}

/**
 * Selective cache middleware factory
 * Use when you want explicit control over which routes are cached
 */
export function withCache(options: { ttl: number; keyGenerator?: (req: Request) => string }) {
  return async function cacheMiddleware(req: Request, res: CacheableResponse, next: NextFunction): Promise<void> {
    if (!isRedisAvailable()) {
      next();
      return;
    }

    const cacheKey = options.keyGenerator
      ? options.keyGenerator(req)
      : `kal:api:${req.method}:${req.originalUrl}`;

    try {
      const cached = await cache.get<{ body: string; contentType: string }>(cacheKey);

      if (cached) {
        res.setHeader("X-Cache", "HIT");
        res.setHeader("Content-Type", cached.contentType || "application/json");
        res.send(cached.body);
        return;
      }

      res.setHeader("X-Cache", "MISS");

      const originalJson = res.json.bind(res);
      res.json = function (body: unknown): Response {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cache.set(cacheKey, {
            body: JSON.stringify(body),
            contentType: "application/json",
          }, options.ttl).catch(() => {});
        }
        return originalJson(body);
      };

      next();
    } catch {
      next();
    }
  };
}
