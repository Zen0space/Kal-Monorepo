export interface User {
  _id: string;
  logtoId: string;
  email: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
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
