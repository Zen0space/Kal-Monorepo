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
  burstLimit: number; // per minute
}

export const RATE_LIMITS: Record<UserTier, RateLimitConfig> = {
  free: { dailyLimit: 100, burstLimit: 10 },
  tier_1: { dailyLimit: 250, burstLimit: 30 },
  tier_2: { dailyLimit: 700, burstLimit: 50 },
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
