/**
 * API Request Log Service
 * 
 * Handles storing and querying API request logs in MongoDB.
 */

import { randomUUID } from "crypto";

import type { Db, ObjectId } from "mongodb";

/**
 * API Request Log entry stored in MongoDB
 */
export interface ApiRequestLog {
  _id?: ObjectId;

  // Request identification
  requestId: string;
  timestamp: Date;

  // User/Auth info
  userId: string | null;
  apiKeyPrefix: string | null;

  // Request details
  type: "rest" | "trpc";
  method: string;
  endpoint: string;
  query?: Record<string, unknown>;

  // Response details
  statusCode: number;
  duration: number;
  success: boolean;
  error?: string;

  // Metadata
  userAgent?: string;
  ip?: string;
}

/**
 * Options for querying logs
 */
export interface LogQueryOptions {
  userId?: string;
  endpoint?: string;
  type?: "rest" | "trpc";
  statusCode?: number;
  success?: boolean;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Analytics summary for a time period
 */
export interface LogAnalytics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageDuration: number;
  topEndpoints: Array<{ endpoint: string; count: number }>;
  requestsByHour: Array<{ hour: number; count: number }>;
  errorRate: number;
}

/**
 * Request Log Service
 */
export class RequestLogService {
  constructor(private db: Db) { }

  /**
   * Generate a unique request ID
   */
  static generateRequestId(): string {
    return randomUUID();
  }

  /**
   * Insert a new log entry
   */
  async insert(log: Omit<ApiRequestLog, "_id">): Promise<void> {
    try {
      await this.db.collection<ApiRequestLog>("api_request_logs").insertOne(log as ApiRequestLog);
    } catch (error) {
      // Log insertion should never block the request
      console.error("[RequestLogService] Failed to insert log:", error);
    }
  }

  /**
   * Insert a log entry asynchronously (fire and forget)
   * This is the preferred method for middleware use
   */
  insertAsync(log: Omit<ApiRequestLog, "_id">): void {
    // Use setImmediate to defer insertion without blocking
    setImmediate(() => {
      this.insert(log).catch(console.error);
    });
  }

  /**
   * Query logs with filters
   */
  async query(options: LogQueryOptions = {}): Promise<ApiRequestLog[]> {
    const {
      userId,
      endpoint,
      type,
      statusCode,
      success,
      startDate,
      endDate,
      limit = 50,
      offset = 0,
    } = options;

    const filter: Record<string, unknown> = {};

    if (userId) filter.userId = userId;
    if (endpoint) filter.endpoint = { $regex: endpoint, $options: "i" };
    if (type) filter.type = type;
    if (statusCode) filter.statusCode = statusCode;
    if (success !== undefined) filter.success = success;

    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) (filter.timestamp as Record<string, Date>).$gte = startDate;
      if (endDate) (filter.timestamp as Record<string, Date>).$lte = endDate;
    }

    return this.db
      .collection<ApiRequestLog>("api_request_logs")
      .find(filter)
      .sort({ timestamp: -1 })
      .skip(offset)
      .limit(Math.min(limit, 200)) // Cap at 200
      .toArray();
  }

  /**
   * Get total count for pagination
   */
  async count(options: LogQueryOptions = {}): Promise<number> {
    const { userId, endpoint, type, statusCode, success, startDate, endDate } = options;

    const filter: Record<string, unknown> = {};

    if (userId) filter.userId = userId;
    if (endpoint) filter.endpoint = { $regex: endpoint, $options: "i" };
    if (type) filter.type = type;
    if (statusCode) filter.statusCode = statusCode;
    if (success !== undefined) filter.success = success;

    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) (filter.timestamp as Record<string, Date>).$gte = startDate;
      if (endDate) (filter.timestamp as Record<string, Date>).$lte = endDate;
    }

    return this.db.collection<ApiRequestLog>("api_request_logs").countDocuments(filter);
  }

  /**
   * Get analytics for a time period
   */
  async getAnalytics(startDate: Date, endDate: Date): Promise<LogAnalytics> {
    const collection = this.db.collection<ApiRequestLog>("api_request_logs");

    const filter = {
      timestamp: { $gte: startDate, $lte: endDate },
    };

    // Basic stats
    const [statsResult] = await collection.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalRequests: { $sum: 1 },
          successfulRequests: { $sum: { $cond: ["$success", 1, 0] } },
          failedRequests: { $sum: { $cond: ["$success", 0, 1] } },
          totalDuration: { $sum: "$duration" },
        },
      },
    ]).toArray();

    const stats = statsResult || {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalDuration: 0,
    };

    // Top endpoints
    const topEndpoints = await collection.aggregate([
      { $match: filter },
      { $group: { _id: "$endpoint", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
      { $project: { endpoint: "$_id", count: 1, _id: 0 } },
    ]).toArray() as Array<{ endpoint: string; count: number }>;

    // Requests by hour
    const requestsByHour = await collection.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { $hour: "$timestamp" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { hour: "$_id", count: 1, _id: 0 } },
    ]).toArray() as Array<{ hour: number; count: number }>;

    return {
      totalRequests: stats.totalRequests,
      successfulRequests: stats.successfulRequests,
      failedRequests: stats.failedRequests,
      averageDuration: stats.totalRequests > 0
        ? Math.round(stats.totalDuration / stats.totalRequests)
        : 0,
      topEndpoints,
      requestsByHour,
      errorRate: stats.totalRequests > 0
        ? Math.round((stats.failedRequests / stats.totalRequests) * 10000) / 100
        : 0,
    };
  }

  /**
   * Get request counts grouped by day
   */
  async getRequestsByDay(days: number = 30): Promise<Array<{ date: string; count: number; errors: number }>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const result = await this.db.collection<ApiRequestLog>("api_request_logs").aggregate([
      { $match: { timestamp: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          count: { $sum: 1 },
          errors: { $sum: { $cond: ["$success", 0, 1] } },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: "$_id", count: 1, errors: 1, _id: 0 } },
    ]).toArray();

    return result as Array<{ date: string; count: number; errors: number }>;
  }
}
