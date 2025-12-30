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
  
  // Use name, username, or email (before @) as display name
  const displayName = claims.name || claims.username || claims.email?.split("@")[0] || "";

  // Upsert user - create if not exists, update if exists
  const result = await usersCollection.findOneAndUpdate(
    { logtoId: claims.sub },
    {
      $set: {
        email: claims.email || null,
        // Only update name if we have a value (don't overwrite with empty)
        ...(displayName ? { name: displayName } : {}),
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  try {
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

    // Ensure userId is properly converted to string
    const userId = user?._id ? String(user._id) : undefined;

    return {
      db,
      user,
      userId,
    };
  } catch (error) {
    console.error("[Context Error] Failed to create context:", error);
    if (error instanceof Error) {
      console.error("[Context Error] Stack:", error.stack);
    }
    throw error;
  }
}

export type Context = inferAsyncReturnType<typeof createContext>;
