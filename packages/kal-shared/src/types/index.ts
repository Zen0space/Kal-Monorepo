// ===================
// User Tiers
// ===================
export type UserTier = 'free' | 'tier_1' | 'tier_2';

export interface User {
  _id: string;
  logtoId: string;
  email: string;
  name?: string;
  tier: UserTier;
  createdAt: Date;
  updatedAt: Date;
}

// ===================
// Rate Limiting
// ===================
export interface RateLimitConfig {
  dailyLimit: number;
  monthlyLimit: number;
  burstLimit: number; // per minute
}

export const RATE_LIMITS: Record<UserTier, RateLimitConfig> = {
  free: { dailyLimit: 100, monthlyLimit: 3000, burstLimit: 10 },
  tier_1: { dailyLimit: 250, monthlyLimit: 7000, burstLimit: 30 },
  tier_2: { dailyLimit: 700, monthlyLimit: 20000, burstLimit: 50 },
};

export interface RateLimitUsage {
  _id: string;
  userId: string;
  date: string; // YYYY-MM-DD format
  dailyCount: number;
  minuteWindow: Date;
  minuteCount: number;
  updatedAt: Date;
}

// ===================
// Logto Auth
// ===================
export interface LogtoUserInfo {
  sub: string; // Logto user ID
  email?: string;
  name?: string;
  picture?: string;
}

// ===================
// API Keys
// ===================
export type ApiKeyExpiration = '1_week' | '1_month' | 'never';

export interface ApiKey {
  _id: string;
  userId: string;           // Reference to user
  key: string;              // The actual API key (hashed in DB)
  keyPrefix: string;        // First 8 chars for display (e.g., "kal_a1b2...")
  name: string;             // User-defined name for the key
  expiration: ApiKeyExpiration;
  expiresAt: Date | null;   // null = never expires
  createdAt: Date;
  lastUsedAt: Date | null;
  isRevoked: boolean;
  revokedAt: Date | null;
}

// For frontend display (never expose full key after creation)
export interface ApiKeyPublic {
  _id: string;
  keyPrefix: string;
  name: string;
  expiration: ApiKeyExpiration;
  expiresAt: Date | null;
  createdAt: Date;
  lastUsedAt: Date | null;
  isRevoked: boolean;
}



export interface FoodEntry {
  _id: string;
  userId: string;
  name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  date: Date;
  createdAt: Date;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Pagination
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
