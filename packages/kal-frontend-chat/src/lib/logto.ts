import type { LogtoNextConfig } from '@logto/next';

function normalizeEndpoint(endpoint: string): string {
  return endpoint.endsWith('/') ? endpoint : `${endpoint}/`;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
}

export function getLogtoConfig(): LogtoNextConfig {
  const endpoint = (process.env.NEXT_PUBLIC_LOGTO_ENDPOINT || 'http://localhost:3001').trim();
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003').trim();
  const appId = (process.env.NEXT_PUBLIC_LOGTO_APP_ID || '').trim();
  const appSecret = (process.env.LOGTO_APP_SECRET || '').trim();
  const cookieSecret = (process.env.SESSION_SECRET || 'dev-secret-please-change-in-production').trim();
  
  return {
    endpoint: normalizeEndpoint(endpoint),
    appId,
    appSecret,
    baseUrl: normalizeBaseUrl(baseUrl),
    cookieSecret,
    cookieSecure: process.env.NODE_ENV === 'production',
  };
}

export const logtoConfig = getLogtoConfig();
