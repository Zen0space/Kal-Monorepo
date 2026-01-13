import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "kal-backend/src/routers";

export const trpc = createTRPCReact<AppRouter>();
