/**
 * SSE endpoint for streaming chat responses.
 *
 * POST /api/chat/stream
 *   Body: { threadId: string, content: string }
 *   Headers: x-logto-id (required), x-logto-email, x-logto-name
 *
 * Responds with Server-Sent Events following the ChatSSEEvent protocol.
 */

import { Router, type Request, type Response } from "express";
import type { User } from "kal-shared";

import { getDB } from "../lib/db.js";
import { runChatWorkflow } from "../lib/chat-workflow.js";

export const chatStreamRouter: Router = Router();

/**
 * Resolve user from x-logto-id header (same logic as context.ts).
 * Returns null if not authenticated.
 */
async function resolveUser(req: Request): Promise<{ logtoId: string } | null> {
  const logtoId = req.headers["x-logto-id"] as string | undefined;
  if (!logtoId) return null;

  const db = getDB();

  // Try to find user or auto-create (mirrors context.ts behaviour)
  let user = await db.collection<User>("users").findOne({ logtoId });

  if (!user) {
    const email = (req.headers["x-logto-email"] as string) || null;
    const name = (req.headers["x-logto-name"] as string) || undefined;
    const now = new Date();

    const result = await db.collection("users").findOneAndUpdate(
      { logtoId },
      {
        $set: {
          email,
          ...(name ? { name } : {}),
          updatedAt: now,
        },
        $setOnInsert: {
          logtoId,
          tier: "free",
          createdAt: now,
        },
      },
      { upsert: true, returnDocument: "after" }
    );
    user = result as unknown as User | null;
  }

  return user ? { logtoId: user.logtoId } : null;
}

// ── POST /api/chat/stream ──
chatStreamRouter.post("/stream", async (req: Request, res: Response) => {
  // --- Auth ---
  const user = await resolveUser(req);
  if (!user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  // --- Validate body ---
  const { threadId, content } = req.body as {
    threadId?: string;
    content?: string;
  };

  if (!threadId || typeof threadId !== "string") {
    res.status(400).json({ error: "threadId is required" });
    return;
  }
  if (!content || typeof content !== "string" || content.trim().length === 0) {
    res.status(400).json({ error: "content is required" });
    return;
  }
  if (content.length > 10000) {
    res.status(400).json({ error: "content exceeds maximum length (10000)" });
    return;
  }

  // --- Setup SSE headers ---
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no", // Disable nginx buffering
  });

  // Flush headers immediately
  res.flushHeaders();

  // Handle client disconnect
  let aborted = false;
  req.on("close", () => {
    aborted = true;
  });

  // --- Run workflow and stream events ---
  const db = getDB();

  try {
    const workflow = runChatWorkflow({
      threadId,
      content: content.trim(),
      userId: user.logtoId,
      db,
    });

    for await (const event of workflow) {
      if (aborted) break;

      // Write SSE: event type + JSON data
      res.write(`event: ${event.type}\n`);
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }
  } catch (error) {
    console.error("[SSE] Workflow error:", error);

    if (!aborted) {
      const errorEvent = JSON.stringify({
        type: "error",
        message: "Internal server error",
      });
      res.write(`event: error\n`);
      res.write(`data: ${errorEvent}\n\n`);

      res.write(`event: done\n`);
      res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
    }
  } finally {
    if (!aborted) {
      res.end();
    }
  }
});
