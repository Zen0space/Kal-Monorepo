import { cache } from "../lib/cache.js";
import { CacheTTL } from "../lib/cache-keys.js";
import { router, publicProcedure } from "../lib/trpc.js";

export const userRouter = router({
  stats: publicProcedure.query(async ({ ctx }) => {
    // You might want to cache this for a short time
    const cacheKey = "trpc:user:stats"; // Or add to CacheKeys if strict

    return cache.wrap(cacheKey, CacheTTL.STATS, async () => {
      const totalUsers = await ctx.db.collection("users").countDocuments();
      return {
        total: totalUsers,
      };
    });
  }),

  growth: publicProcedure.query(async ({ ctx }) => {
    const cacheKey = "trpc:user:growth:weekly"; // Changed key to reflect weekly
    
    // We'll skip caching for dev to see instant updates or keep short TTL
    return cache.wrap(cacheKey, CacheTTL.STATS, async () => {
      // Aggregate users by Year, Month, Week
      const growth = await ctx.db.collection("users").aggregate([
        {
          $group: {
            _id: { 
              year: { $year: "$createdAt" }, 
              month: { $month: "$createdAt" },
              // Force 4 weeks: 1-7=W1, 8-14=W2, 15-21=W3, 22+=W4
              week: {
                $switch: {
                  branches: [
                    { case: { $lte: [{ $dayOfMonth: "$createdAt" }, 7] }, then: 1 },
                    { case: { $lte: [{ $dayOfMonth: "$createdAt" }, 14] }, then: 2 },
                    { case: { $lte: [{ $dayOfMonth: "$createdAt" }, 21] }, then: 3 },
                  ],
                  default: 4
                }
              }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.week": 1 } }
      ]).toArray();

      return growth.map(item => ({
        year: item._id.year,
        month: item._id.month, // 1-12
        week: item._id.week,   // 1-5
        count: item.count
      }));
    });
  }),

  list: publicProcedure.query(async ({ ctx }) => {
    const users = await ctx.db.collection("users").aggregate([
      {
        $lookup: {
          from: "api_keys",
          localField: "_id",     // User _id (ObjectId or string depending on schema, usually ObjectId in Mongo)
          foreignField: "userId", // stored as string usually if coming from context.userId
          as: "keys"
        }
      },
      // If userId in api_keys is string but _id in users is ObjectId, retrieval might require conversion.
      // However, usually we store userId as string in other collections if we use Logto IDs or stringified ObjectIds.
      // Let's assume standard behavior: if userId in api_keys matches _id (or we need to match carefully).
      // Based on context.ts, userId is stringified ObjectId.
      // So in api_keys, userId is likely a string. In users, _id is ObjectId.
      // We might need to convert _id to string for lookup or handle it.
      // Actually, $lookup with pure Mongo requires types match.
      // Let's check api-keys.ts: userId is ctx.userId! which is string.
      // So we need to match User._id (ObjectId) to ApiKey.userId (String).
      // $lookup direct won't work if types differ. 
      // We can use $addFields to convert _id to string first or use let/pipeline (more complex).
      // SIMPLER: just fetch all users and count keys separately? Or use aggregation with conversion.
      // Let's try aggregation with toString.
      {
        $addFields: {
          userIdString: { $toString: "$_id" }
        }
      },
      {
        $lookup: {
          from: "api_keys",
          localField: "userIdString",
          foreignField: "userId",
          as: "keys"
        }
      },
      {
        $project: {
          _id: { $toString: "$_id" },
          name: 1,
          email: 1,
          tier: 1,
          createdAt: 1,
          apiKeyCount: { $size: "$keys" }
        }
      },
      { $sort: { createdAt: -1 } }
    ]).toArray();

    return users.map(u => ({
      _id: u._id,
      name: u.name || "Unknown",
      email: u.email,
      tier: u.tier || "free",
      createdAt: u.createdAt,
      apiKeyCount: u.apiKeyCount
    }));
  }),
});
