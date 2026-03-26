import type { ChatThread, ChatThreadPreview } from "kal-shared";
import { ObjectId } from "mongodb";
import { z } from "zod";

import { router, protectedProcedure } from "../lib/trpc.js";

// Helper to ensure user is authenticated
function requireUser(user: { logtoId: string } | null): { logtoId: string } {
  if (!user) {
    throw new Error("Authentication required");
  }
  return user;
}

// ===================
// Thread Management
// ===================

export const chatRouter = router({
  // Create a new chat thread
  createThread: protectedProcedure.mutation(async ({ ctx }) => {
    const user = requireUser(ctx.user);
    console.log("[Chat] createThread called by user:", user.logtoId);

    const now = new Date();
    const thread = {
      userId: user.logtoId,
      title: "New Conversation",
      createdAt: now,
      updatedAt: now,
      messageCount: 0,
    };

    const result = await ctx.db.collection("chat_threads").insertOne(thread);
    console.log("[Chat] Thread created:", result.insertedId.toString());

    return {
      _id: result.insertedId.toString(),
      ...thread,
    };
  }),

  // Get all threads for the current user
  getThreads: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().min(1).max(100).default(20),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const user = requireUser(ctx.user);
      const limit = input?.limit ?? 20;

      const threads = await ctx.db
        .collection("chat_threads")
        .find({ userId: user.logtoId })
        .sort({ updatedAt: -1 })
        .limit(limit)
        .toArray();

      // Get last message preview for each thread
      const threadsWithPreview: ChatThreadPreview[] = await Promise.all(
        threads.map(async (thread) => {
          const lastMessage = await ctx.db
            .collection("chat_messages")
            .findOne(
              { threadId: thread._id.toString() },
              { sort: { createdAt: -1 } }
            );

          return {
            _id: thread._id.toString(),
            title: thread.title as string,
            updatedAt: thread.updatedAt as Date,
            messageCount: thread.messageCount as number,
            lastMessage: lastMessage?.content?.slice(0, 100),
          };
        })
      );

      return threadsWithPreview;
    }),

  // Delete a thread and its messages
  deleteThread: protectedProcedure
    .input(z.object({ threadId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = requireUser(ctx.user);
      const threadId = input.threadId;

      // Verify ownership
      const thread = await ctx.db.collection("chat_threads").findOne({
        _id: new ObjectId(threadId),
        userId: user.logtoId,
      });

      if (!thread) {
        throw new Error("Thread not found or access denied");
      }

      // Delete all messages in the thread
      await ctx.db.collection("chat_messages").deleteMany({ threadId });

      // Delete the thread
      await ctx.db
        .collection("chat_threads")
        .deleteOne({ _id: new ObjectId(threadId) });

      return { success: true };
    }),

  // ===================
  // Message Management
  // ===================
  // NOTE: sendMessage has been replaced by the SSE endpoint at POST /api/chat/stream
  // See: routes/chat-stream.ts + lib/chat-workflow.ts

  // Get messages for a thread
  getMessages: protectedProcedure
    .input(
      z.object({
        threadId: z.string(),
        limit: z.number().min(1).max(100).default(50),
        before: z.string().optional(), // Cursor for pagination
      })
    )
    .query(async ({ ctx, input }) => {
      const user = requireUser(ctx.user);
      const { threadId, limit, before } = input;

      // Verify thread ownership
      const thread = await ctx.db.collection("chat_threads").findOne({
        _id: new ObjectId(threadId),
        userId: user.logtoId,
      });

      if (!thread) {
        throw new Error("Thread not found or access denied");
      }

      // Build query
      const query: Record<string, unknown> = { threadId };
      if (before) {
        query.createdAt = { $lt: new Date(before) };
      }

      const messages = await ctx.db
        .collection("chat_messages")
        .find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();

      // Reverse to chronological order
      messages.reverse();

      return messages.map((msg) => ({
        _id: msg._id.toString(),
        threadId: msg.threadId as string,
        userId: msg.userId as string,
        role: msg.role as "User" | "Assistant",
        content: msg.content as string,
        createdAt: msg.createdAt as Date,
      }));
    }),

  // Update thread title
  updateThreadTitle: protectedProcedure
    .input(
      z.object({
        threadId: z.string(),
        title: z.string().min(1).max(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = requireUser(ctx.user);
      const { threadId, title } = input;

      const result = await ctx.db.collection("chat_threads").updateOne(
        {
          _id: new ObjectId(threadId),
          userId: user.logtoId,
        },
        {
          $set: { title, updatedAt: new Date() },
        }
      );

      if (result.matchedCount === 0) {
        throw new Error("Thread not found or access denied");
      }

      return { success: true };
    }),
});
