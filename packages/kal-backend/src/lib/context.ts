import { inferAsyncReturnType } from "@trpc/server";
import { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { getDB } from "./db";

export async function createContext({ req }: CreateExpressContextOptions) {
  // TODO: Add Logto authentication
  // For now, return a mock user for development
  const userId = req.headers["x-user-id"] as string | undefined;

  return {
    db: getDB(),
    userId, // Will be populated after Logto auth
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;
