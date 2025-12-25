import type { LogtoNextConfig } from '@logto/next';

export const logtoConfig: LogtoNextConfig = {
  endpoint: process.env.NEXT_PUBLIC_LOGTO_ENDPOINT || 'http://localhost:3001',
  appId: process.env.NEXT_PUBLIC_LOGTO_APP_ID || '',
  appSecret: process.env.LOGTO_APP_SECRET || '',
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  cookieSecret: process.env.SESSION_SECRET || 'dev-secret-please-change-in-production',
  cookieSecure: process.env.NODE_ENV === 'production',
};
