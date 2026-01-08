import Redis from "ioredis";

import { logger } from "./logger.js";

let redisClient: Redis | null = null;

/**
 * Get Redis connection URL from environment variables
 */
function getRedisUrl(): string | null {
  if (process.env.REDIS_URL) {
    return process.env.REDIS_URL;
  }

  const host = process.env.REDIS_HOST;
  const port = process.env.REDIS_PORT || "6379";
  const password = process.env.REDIS_PASSWORD;
  const username = process.env.REDIS_USERNAME || "default";

  if (host) {
    if (password) {
      return `redis://${username}:${password}@${host}:${port}`;
    }
    return `redis://${host}:${port}`;
  }

  return null;
}

/**
 * Initialize Redis connection
 * Returns null if Redis is not configured (graceful degradation)
 */
export async function connectRedis(): Promise<Redis | null> {
  if (redisClient) {
    return redisClient;
  }

  const redisUrl = getRedisUrl();

  if (!redisUrl) {
    logger.warn("Redis not configured - caching disabled");
    return null;
  }

  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times: number) {
        if (times > 3) {
          logger.error("Redis connection failed after 3 retries");
          return null; // Stop retrying
        }
        const delay = Math.min(times * 200, 2000);
        return delay;
      },
      lazyConnect: true,
    });

    // Event handlers
    redisClient.on("connect", () => {
      logger.info("Redis connecting...");
    });

    redisClient.on("ready", () => {
      logger.info("Redis connected and ready");
    });

    redisClient.on("error", (err: Error) => {
      logger.error(`Redis error: ${err.message}`);
    });

    redisClient.on("close", () => {
      logger.warn("Redis connection closed");
    });

    // Attempt connection
    await redisClient.connect();

    // Test connection
    await redisClient.ping();
    logger.info("Redis ping successful");

    return redisClient;
  } catch (error) {
    logger.error(`Failed to connect to Redis: ${(error as Error).message}`);
    redisClient = null;
    return null;
  }
}

/**
 * Get Redis client instance
 * Returns null if not connected
 */
export function getRedis(): Redis | null {
  return redisClient;
}

/**
 * Check if Redis is connected and available
 */
export function isRedisAvailable(): boolean {
  return redisClient !== null && redisClient.status === "ready";
}

/**
 * Close Redis connection gracefully
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info("Redis connection closed");
  }
}

/**
 * Get Redis health status for health checks
 */
export async function getRedisHealth(): Promise<{
  status: "healthy" | "unhealthy" | "disabled";
  latency?: number;
}> {
  if (!redisClient) {
    return { status: "disabled" };
  }

  try {
    const start = Date.now();
    await redisClient.ping();
    const latency = Date.now() - start;
    return { status: "healthy", latency };
  } catch {
    return { status: "unhealthy" };
  }
}
