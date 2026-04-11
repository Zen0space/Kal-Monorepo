import { router } from "../lib/trpc.js";

import { adminLogsRouter } from "./admin-logs.js";
import { apiKeysRouter } from "./api-keys.js";
import { chatRouter } from "./chat.js";
import { feedbackRouter } from "./feedback.js";
import { foodRouter } from "./food.js";
import { halalRouter } from "./halal.js";
import { platformSettingsRouter } from "./platform-settings.js";
import { pushRouter } from "./push.js";
import { pwaRouter } from "./pwa.js";
import { requestLogsRouter } from "./request-logs.js";
import { subscriptionRouter } from "./subscription.js";
import { userRouter } from "./user.js";

export const appRouter = router({
  food: foodRouter,
  halal: halalRouter,
  apiKeys: apiKeysRouter,
  chat: chatRouter,
  feedback: feedbackRouter,
  user: userRouter,
  platformSettings: platformSettingsRouter,
  requestLogs: requestLogsRouter,
  adminLogs: adminLogsRouter,
  subscription: subscriptionRouter,
  push: pushRouter,
  pwa: pwaRouter,
});

// Export type for client
export type AppRouter = typeof appRouter;
