import { z } from "zod";

import { router, publicProcedure } from "../lib/trpc.js";

export const halalRouter = router({
  // Search halal foods database (public)
  search: publicProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ input, ctx }) => {
      const foods = await ctx.db
        .collection("halal_foods")
        .find({ name: { $regex: input.query, $options: "i" } })
        .limit(20)
        .toArray();

      return foods.map((food) => ({
        _id: food._id.toString(),
        name: food.name,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        serving: food.serving,
        category: food.category,
        brand: food.brand,
        halalCertifier: food.halalCertifier,
        halalCertYear: food.halalCertYear,
      }));
    }),

  // Get all halal foods (public)
  all: publicProcedure.query(async ({ ctx }) => {
    const foods = await ctx.db.collection("halal_foods").find({}).toArray();
    return foods.map((food) => ({
      _id: food._id.toString(),
      name: food.name,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      serving: food.serving,
      category: food.category,
      brand: food.brand,
      halalCertifier: food.halalCertifier,
      halalCertYear: food.halalCertYear,
    }));
  }),

  // Get all halal foods with pagination (public)
  allPaginated: publicProcedure
    .input(
      z.object({
        cursor: z.number().default(0),
        limit: z.number().default(10),
        brand: z.string().optional(),
        category: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const query: Record<string, unknown> = {};
      if (input.brand) query.brand = input.brand;
      if (input.category) query.category = input.category;

      const [foods, total] = await Promise.all([
        ctx.db
          .collection("halal_foods")
          .find(query)
          .skip(input.cursor)
          .limit(input.limit)
          .toArray(),
        ctx.db.collection("halal_foods").countDocuments(query),
      ]);

      return {
        items: foods.map((food) => ({
          _id: food._id.toString(),
          name: food.name,
          calories: food.calories,
          protein: food.protein,
          carbs: food.carbs,
          fat: food.fat,
          serving: food.serving,
          category: food.category,
          brand: food.brand,
          halalCertifier: food.halalCertifier,
          halalCertYear: food.halalCertYear,
        })),
        nextCursor:
          input.cursor + foods.length < total
            ? input.cursor + input.limit
            : null,
        total,
      };
    }),

  // Get all brands (public)
  brands: publicProcedure.query(async ({ ctx }) => {
    const brands = await ctx.db
      .collection("halal_foods")
      .distinct("brand");
    return brands.filter(Boolean).sort();
  }),

  // Get all categories for halal foods (public)
  categories: publicProcedure.query(async ({ ctx }) => {
    const categories = await ctx.db
      .collection("halal_foods")
      .distinct("category");
    return categories.filter(Boolean).sort();
  }),

  // Get foods by brand (public)
  byBrand: publicProcedure
    .input(z.object({ brand: z.string() }))
    .query(async ({ input, ctx }) => {
      const foods = await ctx.db
        .collection("halal_foods")
        .find({ brand: input.brand })
        .toArray();

      return foods.map((food) => ({
        _id: food._id.toString(),
        name: food.name,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        serving: food.serving,
        category: food.category,
        brand: food.brand,
        halalCertifier: food.halalCertifier,
        halalCertYear: food.halalCertYear,
      }));
    }),
});
