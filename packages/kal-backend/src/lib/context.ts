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
  claims: LogtoUserInfo & { username?: string }
): Promise<User | null> {
  if (!claims.sub) return null;

  const now = new Date();
  const usersCollection = db.collection<User>("users");
  
  const displayName = claims.name || claims.username;

  // Upsert user - create if not exists, update if exists
  const result = await usersCollection.findOneAndUpdate(
    { logtoId: claims.sub },
    {
      $set: {
        email: claims.email || "",
        name: displayName,
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
    user = await syncUserFromLogto(db, {
      ...logtoUser.claims,
      username: logtoUser.claims.username || undefined,
    });
  }

  // Fallback to header-based auth (for API keys or development)
  if (!user) {
    // Try Logto ID from frontend header (when using Next.js proxy/tRPC)
    const headerLogtoId = req.headers["x-logto-id"] as string | undefined;
    if (headerLogtoId) {
      user = await db.collection<User>("users").findOne({ logtoId: headerLogtoId });
      
      const headerEmail = req.headers["x-logto-email"] as string | undefined;
      const headerName = req.headers["x-logto-name"] as string | undefined;

      // If user not found but we have claims in headers (trusted from frontend), create/sync them
      if (!user) {
        // Proceed if we at least have an email or if the ID is sufficient for a basic record
        if (headerLogtoId) {
          user = await syncUserFromLogto(db, {
            sub: headerLogtoId,
            email: headerEmail,
            name: headerName,
          });
        }
      } else if (headerName && !user.name) {
         // Update if local name is missing but header has one
         await db.collection<User>("users").updateOne(
           { _id: user._id }, 
           { $set: { name: headerName, email: headerEmail || user.email } } 
         );
         user.name = headerName;
         if (headerEmail) user.email = headerEmail;
      }
    }

    // Try explicit user ID (development)
    const headerUserId = req.headers["x-user-id"] as string | undefined;
    if (!user && headerUserId) {
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
