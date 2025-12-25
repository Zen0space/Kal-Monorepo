import type { LogtoNextConfig } from '@logto/next';

// Ensure endpoint has trailing slash for OIDC discovery
function normalizeEndpoint(endpoint: string): string {
  return endpoint.endsWith('/') ? endpoint : `${endpoint}/`;
}

const endpoint = process.env.NEXT_PUBLIC_LOGTO_ENDPOINT || 'http://localhost:3001';

export const logtoConfig: LogtoNextConfig = {
  endpoint: normalizeEndpoint(endpoint),
  appId: process.env.NEXT_PUBLIC_LOGTO_APP_ID || '',
  appSecret: process.env.LOGTO_APP_SECRET || '',
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  cookieSecret: process.env.SESSION_SECRET || 'dev-secret-please-change-in-production',
  cookieSecure: process.env.NODE_ENV === 'production',
};

// Debug: Log config in development (not secrets)
if (process.env.NODE_ENV !== 'production') {
  console.info('[Logto Config]', {
    endpoint: logtoConfig.endpoint,
    appId: logtoConfig.appId,
    baseUrl: logtoConfig.baseUrl,
    hasAppSecret: !!logtoConfig.appSecret,
    cookieSecure: logtoConfig.cookieSecure,
  });
}
