import { Router, type Router as RouterType } from "express";

import { getDB } from "../lib/db.js";
import { validateApiKeyMiddleware } from "../middleware/api-key-middleware.js";

const router: RouterType = Router();

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
router.get("/foods/search", async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== "string") {
      return res.status(400).json({
        success: false,
        error: "Query parameter 'q' is required",
      });
    }

    const db = getDB();
    const foods = await db
      .collection("natural_foods")
      .find({ name: { $regex: q, $options: "i" } })
      .limit(20)
      .toArray();

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
    console.error("API Error [/foods/search]:", error);
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
router.get("/foods", async (req, res) => {
  try {
    const { category, limit = "50", offset = "0" } = req.query;

    const limitNum = Math.min(parseInt(limit as string) || 50, 200);
    const offsetNum = parseInt(offset as string) || 0;

    const db = getDB();
    const query = category ? { category } : {};

    const [foods, total] = await Promise.all([
      db
        .collection("natural_foods")
        .find(query)
        .skip(offsetNum)
        .limit(limitNum)
        .toArray(),
      db.collection("natural_foods").countDocuments(query),
    ]);

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
    console.error("API Error [/foods]:", error);
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
router.get("/foods/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { ObjectId } = await import("mongodb");

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid food ID",
      });
    }

    const db = getDB();
    const food = await db.collection("natural_foods").findOne({ _id: new ObjectId(id) });

    if (!food) {
      return res.status(404).json({
        success: false,
        error: "Food not found",
      });
    }

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
    console.error("API Error [/foods/:id]:", error);
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
router.get("/categories", async (_, res) => {
  try {
    const db = getDB();
    const categories = await db.collection("natural_foods").distinct("category");

    return res.json({
      success: true,
      data: categories.filter(Boolean).sort(),
    });
  } catch (error) {
    console.error("API Error [/categories]:", error);
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
router.get("/halal/search", async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== "string") {
      return res.status(400).json({
        success: false,
        error: "Query parameter 'q' is required",
      });
    }

    const db = getDB();
    const foods = await db
      .collection("halal_foods")
      .find({ name: { $regex: q, $options: "i" } })
      .limit(20)
      .toArray();

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
    console.error("API Error [/halal/search]:", error);
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
router.get("/halal", async (req, res) => {
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
    console.error("API Error [/halal]:", error);
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
router.get("/halal/brands", async (_, res) => {
  try {
    const db = getDB();
    const brands = await db.collection("halal_foods").distinct("brand");

    return res.json({
      success: true,
      data: brands.filter(Boolean).sort(),
    });
  } catch (error) {
    console.error("API Error [/halal/brands]:", error);
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
router.get("/halal/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { ObjectId } = await import("mongodb");

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid food ID",
      });
    }

    const db = getDB();
    const food = await db.collection("halal_foods").findOne({ _id: new ObjectId(id) });

    if (!food) {
      return res.status(404).json({
        success: false,
        error: "Food not found",
      });
    }

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
    console.error("API Error [/halal/:id]:", error);
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
router.get("/stats", async (_, res) => {
  try {
    const db = getDB();

    const [naturalCount, naturalCategories, halalCount, halalBrands] = await Promise.all([
      db.collection("natural_foods").countDocuments(),
      db.collection("natural_foods").distinct("category"),
      db.collection("halal_foods").countDocuments(),
      db.collection("halal_foods").distinct("brand"),
    ]);

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
    console.error("API Error [/stats]:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

export const apiRouter = router;
