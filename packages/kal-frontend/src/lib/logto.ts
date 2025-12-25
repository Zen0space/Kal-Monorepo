import type { LogtoNextConfig } from '@logto/next';

// Ensure endpoint has trailing slash for OIDC discovery
function normalizeEndpoint(endpoint: string): string {
  return endpoint.endsWith('/') ? endpoint : `${endpoint}/`;
}

/**
 * Get Logto config - reads env vars at call time (runtime)
 * This ensures that production secrets are read correctly even if not available at build time
 */
export function getLogtoConfig(): LogtoNextConfig {
  const endpoint = process.env.NEXT_PUBLIC_LOGTO_ENDPOINT || 'http://localhost:3001';
  
  return {
    endpoint: normalizeEndpoint(endpoint),
    appId: process.env.NEXT_PUBLIC_LOGTO_APP_ID || '',
    appSecret: process.env.LOGTO_APP_SECRET || '',
    baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    cookieSecret: process.env.SESSION_SECRET || 'dev-secret-please-change-in-production',
    cookieSecure: process.env.NODE_ENV === 'production',
  };
}

// For backward compatibility - but prefer getLogtoConfig() in route handlers
export const logtoConfig = getLogtoConfig();
