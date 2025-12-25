import { router } from "../lib/trpc.js";

import { apiKeysRouter } from "./api-keys.js";
import { foodRouter } from "./food.js";
import { halalRouter } from "./halal.js";

export const appRouter = router({
  food: foodRouter,
  halal: halalRouter,
  apiKeys: apiKeysRouter,
});

// Export type for client
export type AppRouter = typeof appRouter;

