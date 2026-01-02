import { Router, type Router as RouterType, type Request, type Response } from "express";
import type { User } from "kal-shared";

import { getDB } from "../lib/db.js";
import { logger } from "../lib/logger.js";
import { buildSearchQuery } from "../lib/search.js";
import { validateApiKeyMiddleware } from "../middleware/api-key-middleware.js";

const router: RouterType = Router();

// Extended request type with auth info
interface AuthRequest extends Request {
  apiUser?: User;
  startTime?: number;
  keyPrefix?: string;
}

// Helper to log successful responses
function logSuccess(req: AuthRequest, res: Response, data: { count?: number; query?: string }) {
  const duration = req.startTime ? Date.now() - req.startTime : 0;
  const endpoint = req.originalUrl.split("?")[0];
  logger.apiSuccess(req.method, endpoint, 200, duration, {
    apiKeyPrefix: req.keyPrefix,
    userId: req.apiUser?._id.toString(),
    query: data.query,
  });
}

// Helper to log error responses
function logError(req: AuthRequest, status: number, error: string) {
  const duration = req.startTime ? Date.now() - req.startTime : 0;
  const endpoint = req.originalUrl.split("?")[0];
  logger.apiError(req.method, endpoint, status, error, {
    apiKeyPrefix: req.keyPrefix,
    userId: req.apiUser?._id.toString(),
    duration,
  });
}

// Apply API key validation to all routes
router.use(validateApiKeyMiddleware);

// ============================================
// Natural Foods - Public REST API (requires API key)
// ============================================

/**
 * GET /api/foods/search
 * Search natural foods by name
 * Query params: q (required) - search query
 */
router.get("/foods/search", async (req: AuthRequest, res: Response) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== "string") {
      logError(req, 400, "Missing query parameter 'q'");
      return res.status(400).json({
        success: false,
        error: "Query parameter 'q' is required",
      });
    }

    const db = getDB();
    const searchQuery = buildSearchQuery(q);
    const foods = await db
      .collection("foods")
      .find(searchQuery)
      .limit(20)
      .toArray();

    logSuccess(req, res, { count: foods.length, query: q });

    return res.json({
      success: true,
      data: foods.map((food) => ({
        id: food._id.toString(),
        name: food.name,
        calories: food.calories,
        protein: food.protein ?? 0,
        carbs: food.carbs ?? 0,
        fat: food.fat ?? 0,
        serving: food.serving,
        category: food.category,
      })),
      count: foods.length,
    });
  } catch (error) {
    logError(req, 500, (error as Error).message);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * GET /api/foods
 * Get all natural foods or filter by category
 * Query params:
 *   - category (optional) - filter by category
 *   - limit (optional) - max results (default: 50, max: 200)
 *   - offset (optional) - pagination offset (default: 0)
 */
router.get("/foods", async (req: AuthRequest, res: Response) => {
  try {
    const { category, limit = "50", offset = "0" } = req.query;

    const limitNum = Math.min(parseInt(limit as string) || 50, 200);
    const offsetNum = parseInt(offset as string) || 0;

    const db = getDB();
    const query = category ? { category } : {};

    const [foods, total] = await Promise.all([
      db
        .collection("foods")
        .find(query)
        .skip(offsetNum)
        .limit(limitNum)
        .toArray(),
      db.collection("foods").countDocuments(query),
    ]);

    logSuccess(req, res, { count: foods.length });

    return res.json({
      success: true,
      data: foods.map((food) => ({
        id: food._id.toString(),
        name: food.name,
        calories: food.calories,
        protein: food.protein ?? 0,
        carbs: food.carbs ?? 0,
        fat: food.fat ?? 0,
        serving: food.serving,
        category: food.category,
      })),
      pagination: {
        total,
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + foods.length < total,
      },
    });
  } catch (error) {
    logError(req, 500, (error as Error).message);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * GET /api/foods/:id
 * Get a single natural food by ID
 */
router.get("/foods/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { ObjectId } = await import("mongodb");

    if (!ObjectId.isValid(id)) {
      logError(req, 400, "Invalid food ID");
      return res.status(400).json({
        success: false,
        error: "Invalid food ID",
      });
    }

    const db = getDB();
    const food = await db.collection("foods").findOne({ _id: new ObjectId(id) });

    if (!food) {
      logError(req, 404, "Food not found");
      return res.status(404).json({
        success: false,
        error: "Food not found",
      });
    }

    logSuccess(req, res, {});

    return res.json({
      success: true,
      data: {
        id: food._id.toString(),
        name: food.name,
        calories: food.calories,
        protein: food.protein ?? 0,
        carbs: food.carbs ?? 0,
        fat: food.fat ?? 0,
        serving: food.serving,
        category: food.category,
      },
    });
  } catch (error) {
    logError(req, 500, (error as Error).message);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * GET /api/categories
 * Get all natural food categories
 */
router.get("/categories", async (req: AuthRequest, res: Response) => {
  try {
    const db = getDB();
    const categories = await db.collection("foods").distinct("category");

    logSuccess(req, res, { count: categories.length });

    return res.json({
      success: true,
      data: categories.filter(Boolean).sort(),
    });
  } catch (error) {
    logError(req, 500, (error as Error).message);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// ============================================
// Halal Foods - Public REST API
// ============================================

/**
 * GET /api/halal/search
 * Search halal foods by name
 * Query params: q (required) - search query
 */
router.get("/halal/search", async (req: AuthRequest, res: Response) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== "string") {
      logError(req, 400, "Missing query parameter 'q'");
      return res.status(400).json({
        success: false,
        error: "Query parameter 'q' is required",
      });
    }

    const db = getDB();
    const searchQuery = buildSearchQuery(q);
    const foods = await db
      .collection("halal_foods")
      .find(searchQuery)
      .limit(20)
      .toArray();

    logSuccess(req, res, { count: foods.length, query: q });

    return res.json({
      success: true,
      data: foods.map((food) => ({
        id: food._id.toString(),
        name: food.name,
        calories: food.calories,
        protein: food.protein ?? 0,
        carbs: food.carbs ?? 0,
        fat: food.fat ?? 0,
        serving: food.serving,
        category: food.category,
        brand: food.brand,
        halalCertifier: food.halalCertifier,
        halalCertYear: food.halalCertYear,
      })),
      count: foods.length,
    });
  } catch (error) {
    logError(req, 500, (error as Error).message);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * GET /api/halal
 * Get all halal foods or filter by brand/category
 * Query params:
 *   - brand (optional) - filter by brand
 *   - category (optional) - filter by category
 *   - limit (optional) - max results (default: 50, max: 200)
 *   - offset (optional) - pagination offset (default: 0)
 */
router.get("/halal", async (req: AuthRequest, res: Response) => {
  try {
    const { brand, category, limit = "50", offset = "0" } = req.query;

    const limitNum = Math.min(parseInt(limit as string) || 50, 200);
    const offsetNum = parseInt(offset as string) || 0;

    const db = getDB();
    const query: Record<string, unknown> = {};
    if (brand) query.brand = brand;
    if (category) query.category = category;

    const [foods, total] = await Promise.all([
      db
        .collection("halal_foods")
        .find(query)
        .skip(offsetNum)
        .limit(limitNum)
        .toArray(),
      db.collection("halal_foods").countDocuments(query),
    ]);

    logSuccess(req, res, { count: foods.length });

    return res.json({
      success: true,
      data: foods.map((food) => ({
        id: food._id.toString(),
        name: food.name,
        calories: food.calories,
        protein: food.protein ?? 0,
        carbs: food.carbs ?? 0,
        fat: food.fat ?? 0,
        serving: food.serving,
        category: food.category,
        brand: food.brand,
        halalCertifier: food.halalCertifier,
        halalCertYear: food.halalCertYear,
      })),
      pagination: {
        total,
        limit: limitNum,
        offset: offsetNum,
        hasMore: offsetNum + foods.length < total,
      },
    });
  } catch (error) {
    logError(req, 500, (error as Error).message);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * GET /api/halal/brands
 * Get all halal food brands
 */
router.get("/halal/brands", async (req: AuthRequest, res: Response) => {
  try {
    const db = getDB();
    const brands = await db.collection("halal_foods").distinct("brand");

    logSuccess(req, res, { count: brands.length });

    return res.json({
      success: true,
      data: brands.filter(Boolean).sort(),
    });
  } catch (error) {
    logError(req, 500, (error as Error).message);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * GET /api/halal/:id
 * Get a single halal food by ID
 */
router.get("/halal/:id", async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { ObjectId } = await import("mongodb");

    if (!ObjectId.isValid(id)) {
      logError(req, 400, "Invalid food ID");
      return res.status(400).json({
        success: false,
        error: "Invalid food ID",
      });
    }

    const db = getDB();
    const food = await db.collection("halal_foods").findOne({ _id: new ObjectId(id) });

    if (!food) {
      logError(req, 404, "Food not found");
      return res.status(404).json({
        success: false,
        error: "Food not found",
      });
    }

    logSuccess(req, res, {});

    return res.json({
      success: true,
      data: {
        id: food._id.toString(),
        name: food.name,
        calories: food.calories,
        protein: food.protein ?? 0,
        carbs: food.carbs ?? 0,
        fat: food.fat ?? 0,
        serving: food.serving,
        category: food.category,
        brand: food.brand,
        halalCertifier: food.halalCertifier,
        halalCertYear: food.halalCertYear,
      },
    });
  } catch (error) {
    logError(req, 500, (error as Error).message);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// ============================================
// Stats - Public REST API
// ============================================

/**
 * GET /api/stats
 * Get database statistics
 */
router.get("/stats", async (req: AuthRequest, res: Response) => {
  try {
    const db = getDB();

    const [naturalCount, naturalCategories, halalCount, halalBrands] = await Promise.all([
      db.collection("foods").countDocuments(),
      db.collection("foods").distinct("category"),
      db.collection("halal_foods").countDocuments(),
      db.collection("halal_foods").distinct("brand"),
    ]);

    logSuccess(req, res, {});

    return res.json({
      success: true,
      data: {
        naturalFoods: {
          total: naturalCount,
          categories: naturalCategories.filter(Boolean).sort(),
        },
        halalFoods: {
          total: halalCount,
          brands: halalBrands.filter(Boolean).sort(),
        },
      },
    });
  } catch (error) {
    logError(req, 500, (error as Error).message);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

export const apiRouter = router;
