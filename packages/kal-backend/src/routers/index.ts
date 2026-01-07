import { router } from "../lib/trpc.js";

import { apiKeysRouter } from "./api-keys.js";
import { chatRouter } from "./chat.js";
import { feedbackRouter } from "./feedback.js";
import { foodRouter } from "./food.js";
import { halalRouter } from "./halal.js";

export const appRouter = router({
  food: foodRouter,
  halal: halalRouter,
  apiKeys: apiKeysRouter,
  chat: chatRouter,
  feedback: feedbackRouter,
});

// Export type for client
export type AppRouter = typeof appRouter;

