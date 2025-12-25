import type { LogtoExpressConfig } from "@logto/express";

// Logto configuration for Express integration
export const logtoConfig: LogtoExpressConfig = {
  appId: process.env.LOGTO_APP_ID || "",
  appSecret: process.env.LOGTO_APP_SECRET || "",
  endpoint: process.env.LOGTO_ENDPOINT || "http://localhost:3001",
  baseUrl: process.env.BACKEND_BASE_URL || "http://localhost:4000",
};

// Validate Logto config
export function validateLogtoConfig(): boolean {
  if (!logtoConfig.appId || !logtoConfig.appSecret) {
    console.warn(
      "⚠️  Logto authentication not configured. Set LOGTO_APP_ID and LOGTO_APP_SECRET."
    );
    return false;
  }
  return true;
}
