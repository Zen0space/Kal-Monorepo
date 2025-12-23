import { z } from "zod";
import { ObjectId } from "mongodb";
import { router, publicProcedure, protectedProcedure } from "../lib/trpc.js";
import { CreateFoodEntrySchema, GetEntriesSchema, DeleteEntrySchema } from "kal-shared";

export const foodRouter = router({
  // Search foods database (public)
  search: publicProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ input, ctx }) => {
      const foods = await ctx.db
        .collection("foods")
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
      }));
    }),

  // Get all foods (public)
  all: publicProcedure.query(async ({ ctx }) => {
    const foods = await ctx.db.collection("foods").find({}).toArray();
    return foods.map((food) => ({
      _id: food._id.toString(),
      name: food.name,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      serving: food.serving,
    }));
  }),

  // Add a food entry
  create: protectedProcedure
    .input(CreateFoodEntrySchema)
    .mutation(async ({ input, ctx }) => {
      const result = await ctx.db.collection("food_entries").insertOne({
        userId: new ObjectId(ctx.userId),
        name: input.name,
        calories: input.calories,
        protein: input.protein,
        carbs: input.carbs,
        fat: input.fat,
        date: input.date ?? new Date(),
        createdAt: new Date(),
      });
      return { id: result.insertedId.toString() };
    }),

  // Get entries with optional date filter
  list: protectedProcedure
    .input(GetEntriesSchema)
    .query(async ({ input, ctx }) => {
      const query: Record<string, unknown> = {
        userId: new ObjectId(ctx.userId),
      };

      if (input.date) {
        const startOfDay = new Date(input.date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(input.date);
        endOfDay.setHours(23, 59, 59, 999);
        query.date = { $gte: startOfDay, $lte: endOfDay };
      } else if (input.startDate && input.endDate) {
        query.date = { $gte: input.startDate, $lte: input.endDate };
      }

      const skip = (input.page - 1) * input.pageSize;

      const [items, total] = await Promise.all([
        ctx.db
          .collection("food_entries")
          .find(query)
          .sort({ date: -1, createdAt: -1 })
          .skip(skip)
          .limit(input.pageSize)
          .toArray(),
        ctx.db.collection("food_entries").countDocuments(query),
      ]);

      return {
        items: items.map((item) => ({
          ...item,
          _id: item._id.toString(),
          userId: item.userId.toString(),
        })),
        total,
        page: input.page,
        pageSize: input.pageSize,
      };
    }),

  // Get today's entries
  today: protectedProcedure.query(async ({ ctx }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const entries = await ctx.db
      .collection("food_entries")
      .find({
        userId: new ObjectId(ctx.userId),
        date: { $gte: today, $lt: tomorrow },
      })
      .sort({ createdAt: -1 })
      .toArray();

    return entries.map((item) => ({
      ...item,
      _id: item._id.toString(),
      userId: item.userId.toString(),
    }));
  }),

  // Get daily totals
  dailyTotal: protectedProcedure
    .input(z.object({ date: z.coerce.date() }))
    .query(async ({ input, ctx }) => {
      const startOfDay = new Date(input.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(input.date);
      endOfDay.setHours(23, 59, 59, 999);

      const result = await ctx.db
        .collection("food_entries")
        .aggregate([
          {
            $match: {
              userId: new ObjectId(ctx.userId),
              date: { $gte: startOfDay, $lte: endOfDay },
            },
          },
          {
            $group: {
              _id: null,
              totalCalories: { $sum: "$calories" },
              totalProtein: { $sum: { $ifNull: ["$protein", 0] } },
              totalCarbs: { $sum: { $ifNull: ["$carbs", 0] } },
              totalFat: { $sum: { $ifNull: ["$fat", 0] } },
              count: { $sum: 1 },
            },
          },
        ])
        .toArray();

      return result[0] ?? {
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        count: 0,
      };
    }),

  // Delete entry
  delete: protectedProcedure
    .input(DeleteEntrySchema)
    .mutation(async ({ input, ctx }) => {
      const result = await ctx.db.collection("food_entries").deleteOne({
        _id: new ObjectId(input.id),
        userId: new ObjectId(ctx.userId),
      });
      return { success: result.deletedCount === 1 };
    }),
});
