import { router } from "../lib/trpc.js";

import { apiKeysRouter } from "./api-keys.js";
import { chatRouter } from "./chat.js";
import { foodRouter } from "./food.js";
import { halalRouter } from "./halal.js";
import { platformSettingsRouter } from "./platform-settings.js";
import { userRouter } from "./user.js";

export const appRouter = router({
  food: foodRouter,
  halal: halalRouter,
  apiKeys: apiKeysRouter,
  chat: chatRouter,
  user: userRouter,
  platformSettings: platformSettingsRouter,
});

// Export type for client
export type AppRouter = typeof appRouter;
