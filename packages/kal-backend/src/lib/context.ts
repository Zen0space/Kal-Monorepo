import type { inferAsyncReturnType } from "@trpc/server";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { Request } from "express";
import type { User, UserTier, LogtoUserInfo } from "kal-shared";
import type { Db } from "mongodb";

import { getDB } from "./db.js";

// Logto user info from request (after session auth)
type LogtoRequestUser = {
  claims?: LogtoUserInfo;
};

/**
 * Sync user from Logto to MongoDB on first login or update
 */
async function syncUserFromLogto(
  db: Db,
  claims: LogtoUserInfo
): Promise<User | null> {
  if (!claims.sub) return null;

  const now = new Date();
  const usersCollection = db.collection<User>("users");

  // Upsert user - create if not exists, update if exists
  const result = await usersCollection.findOneAndUpdate(
    { logtoId: claims.sub },
    {
      $set: {
        email: claims.email || "",
        name: claims.name,
        updatedAt: now,
      },
      $setOnInsert: {
        logtoId: claims.sub,
        tier: "free" as UserTier,
        createdAt: now,
      },
    },
    { upsert: true, returnDocument: "after" }
  );

  return result as User | null;
}

/**
 * Get user by ID from header (for API key / development)
 */
async function getUserById(db: Db, userId: string): Promise<User | null> {
  const { ObjectId } = await import("mongodb");
  try {
    return await db
      .collection<User>("users")
      .findOne({ _id: new ObjectId(userId) as any });
  } catch {
    return null;
  }
}

export async function createContext({
  req,
}: CreateExpressContextOptions): Promise<{
  db: Db;
  user: User | null;
  userId: string | undefined;
}> {
  const db = getDB();
  let user: User | null = null;

  // Try Logto session first (user is added by @logto/express middleware)
  const logtoUser = (req as Request & { user?: LogtoRequestUser }).user;
  if (logtoUser?.claims?.sub) {
    user = await syncUserFromLogto(db, logtoUser.claims);
  }

  // Fallback to header-based auth (for API keys or development)
  if (!user) {
    const headerUserId = req.headers["x-user-id"] as string | undefined;
    if (headerUserId) {
      user = await getUserById(db, headerUserId);
    }
  }

  return {
    db,
    user,
    userId: user?._id?.toString(),
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;
