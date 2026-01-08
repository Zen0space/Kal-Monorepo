/**
 * Simple structured logger for API requests
 * Works in both development and production
 */

type LogLevel = "info" | "warn" | "error" | "success" | "debug";

interface LogData {
  endpoint?: string;
  method?: string;
  apiKeyPrefix?: string;
  userId?: string;
  query?: string;
  status?: number;
  duration?: number;
  error?: string;
  [key: string]: unknown;
}

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function getTimestamp(): string {
  return new Date().toISOString();
}

function formatLog(level: LogLevel, message: string, data?: LogData): string {
  const timestamp = getTimestamp();
  const prefix = {
    info: `${colors.blue}[INFO]${colors.reset}`,
    warn: `${colors.yellow}[WARN]${colors.reset}`,
    error: `${colors.red}[ERROR]${colors.reset}`,
    success: `${colors.green}[SUCCESS]${colors.reset}`,
    debug: `${colors.dim}[DEBUG]${colors.reset}`,
  }[level];

  let log = `${colors.dim}${timestamp}${colors.reset} ${prefix} ${message}`;

  if (data) {
    const parts: string[] = [];
    if (data.method && data.endpoint) {
      parts.push(`${colors.cyan}${data.method} ${data.endpoint}${colors.reset}`);
    }
    if (data.apiKeyPrefix) {
      parts.push(`key:${data.apiKeyPrefix}...`);
    }
    if (data.userId) {
      parts.push(`user:${data.userId.substring(0, 8)}...`);
    }
    if (data.query) {
      parts.push(`q:"${data.query}"`);
    }
    if (data.status) {
      const statusColor = data.status >= 400 ? colors.red : colors.green;
      parts.push(`${statusColor}${data.status}${colors.reset}`);
    }
    if (data.duration !== undefined) {
      parts.push(`${data.duration}ms`);
    }
    if (data.error) {
      parts.push(`${colors.red}${data.error}${colors.reset}`);
    }
    if (parts.length > 0) {
      log += ` | ${parts.join(" | ")}`;
    }
  }

  return log;
}

export const logger = {
  info: (message: string, data?: LogData) => {
    console.log(formatLog("info", message, data));
  },

  warn: (message: string, data?: LogData) => {
    console.warn(formatLog("warn", message, data));
  },

  error: (message: string, data?: LogData) => {
    console.error(formatLog("error", message, data));
  },

  success: (message: string, data?: LogData) => {
    console.log(formatLog("success", message, data));
  },

  debug: (message: string, data?: LogData) => {
    if (process.env.NODE_ENV !== "production") {
      console.log(formatLog("debug", message, data));
    }
  },

  // API-specific logging
  apiRequest: (method: string, endpoint: string, apiKeyPrefix?: string) => {
    logger.info("API Request", { method, endpoint, apiKeyPrefix });
  },

  apiSuccess: (method: string, endpoint: string, status: number, duration: number, data?: LogData) => {
    logger.success("API Response", { method, endpoint, status, duration, ...data });
  },

  apiError: (method: string, endpoint: string, status: number, error: string, data?: LogData) => {
    logger.error("API Error", { method, endpoint, status, error, ...data });
  },

  authSuccess: (apiKeyPrefix: string, userId: string) => {
    logger.success("API Key Validated", { apiKeyPrefix, userId });
  },

  authFailed: (reason: string, apiKeyPrefix?: string) => {
    logger.warn("API Key Rejected", { error: reason, apiKeyPrefix });
  },

  rateLimited: (userId: string, tier: string) => {
    logger.warn("Rate Limited", { userId, error: `tier:${tier}` });
  },
};

export default logger;
