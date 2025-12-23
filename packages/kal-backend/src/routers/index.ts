import { router } from "../lib/trpc.js";
import { foodRouter } from "./food.js";

export const appRouter = router({
  food: foodRouter,
});

// Export type for client
export type AppRouter = typeof appRouter;
