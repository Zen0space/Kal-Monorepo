import { router } from "../lib/trpc.js";

import { foodRouter } from "./food.js";
import { halalRouter } from "./halal.js";

export const appRouter = router({
  food: foodRouter,
  halal: halalRouter,
});

// Export type for client
export type AppRouter = typeof appRouter;

