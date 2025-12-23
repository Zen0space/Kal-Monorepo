import { router } from "../lib/trpc";
import { foodRouter } from "./food";

export const appRouter = router({
  food: foodRouter,
});

// Export type for client
export type AppRouter = typeof appRouter;
