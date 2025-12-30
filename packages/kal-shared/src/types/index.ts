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
  // Base limits
  minuteLimit: number;       // requests per minute
  dailyLimit: number;        // requests per day
  monthlyLimit: number;      // requests per month
  
  // Burst configuration
  burstBonus: number;        // extra requests allowed during burst
  burstWindowSeconds: number; // burst window duration (typically 10 seconds)
  maxBurstTotal: number;     // max total requests including burst
}

export const RATE_LIMITS: Record<UserTier, RateLimitConfig> = {
  free: {
    minuteLimit: 65,
    dailyLimit: 3300,
    monthlyLimit: 95000,
    burstBonus: 15,
    burstWindowSeconds: 10,
    maxBurstTotal: 80,
  },
  tier_1: {
    minuteLimit: 130,
    dailyLimit: 6600,
    monthlyLimit: 195000,
    burstBonus: 30,
    burstWindowSeconds: 10,
    maxBurstTotal: 160,
  },
  tier_2: {
    minuteLimit: 145,
    dailyLimit: 7500,
    monthlyLimit: 215000,
    burstBonus: 45,
    burstWindowSeconds: 10,
    maxBurstTotal: 190,
  },
};

// VPS Safety Caps - Global limits to protect the server
export interface VpsSafetyCaps {
  maxRequestsPerSecond: number;
  maxConcurrentPerApiKey: number;
}

export const VPS_SAFETY_CAPS: VpsSafetyCaps = {
  maxRequestsPerSecond: 20,
  maxConcurrentPerApiKey: 5,
};

export interface RateLimitUsage {
  _id: string;
  userId: string;
  date: string; // YYYY-MM-DD format
  
  // Daily tracking
  dailyCount: number;
  
  // Minute tracking
  minuteWindow: Date;
  minuteCount: number;
  
  // Second tracking (for VPS safety cap)
  secondWindow?: Date;
  secondCount?: number;
  
  // Burst window tracking
  burstWindowStart?: Date;
  burstCount?: number;
  
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
