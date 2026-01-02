import { quickChat } from 'kal-baml';
import { ObjectId } from 'mongodb';
import { z } from 'zod';

import type { ChatMessage, ChatThread, ChatThreadPreview } from 'kal-shared';

import { router, protectedProcedure } from '../lib/trpc.js';

// Helper to ensure user is authenticated
function requireUser(user: { logtoId: string } | null): { logtoId: string } {
  if (!user) {
    throw new Error('Authentication required');
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
    console.log('[Chat] createThread called by user:', user.logtoId);
    
    const now = new Date();
    const thread = {
      userId: user.logtoId,
      title: 'New Conversation',
      createdAt: now,
      updatedAt: now,
      messageCount: 0,
    };

    const result = await ctx.db.collection('chat_threads').insertOne(thread);
    console.log('[Chat] Thread created:', result.insertedId.toString());

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
        .collection('chat_threads')
        .find({ userId: user.logtoId })
        .sort({ updatedAt: -1 })
        .limit(limit)
        .toArray();

      // Get last message preview for each thread
      const threadsWithPreview: ChatThreadPreview[] = await Promise.all(
        threads.map(async (thread) => {
          const lastMessage = await ctx.db
            .collection('chat_messages')
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
      const thread = await ctx.db.collection('chat_threads').findOne({
        _id: new ObjectId(threadId),
        userId: user.logtoId,
      });

      if (!thread) {
        throw new Error('Thread not found or access denied');
      }

      // Delete all messages in the thread
      await ctx.db.collection('chat_messages').deleteMany({ threadId });

      // Delete the thread
      await ctx.db
        .collection('chat_threads')
        .deleteOne({ _id: new ObjectId(threadId) });

      return { success: true };
    }),

  // ===================
  // Message Management
  // ===================

  // Send a message and get AI response
  sendMessage: protectedProcedure
    .input(
      z.object({
        threadId: z.string(),
        content: z.string().min(1).max(10000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = requireUser(ctx.user);
      const { threadId, content } = input;
      const now = new Date();
      
      console.log('[Chat] sendMessage called:', { user: user.logtoId, threadId, content: content.slice(0, 50) });

      // Verify thread ownership
      const thread = await ctx.db.collection('chat_threads').findOne({
        _id: new ObjectId(threadId),
        userId: user.logtoId,
      });

      if (!thread) {
        console.log('[Chat] Thread not found or access denied:', threadId);
        throw new Error('Thread not found or access denied');
      }

      // Save user message
      const userMessage: Omit<ChatMessage, '_id'> = {
        threadId,
        userId: user.logtoId,
        role: 'User',
        content,
        createdAt: now,
      };

      const userMsgResult = await ctx.db
        .collection('chat_messages')
        .insertOne(userMessage);
      
      console.log('[Chat] User message saved:', userMsgResult.insertedId.toString());

      // Get recent conversation history for context (last 10 messages)
      const recentMessages = await ctx.db
        .collection('chat_messages')
        .find({ threadId })
        .sort({ createdAt: -1 })
        .limit(10)
        .toArray();

      // Reverse to chronological order
      recentMessages.reverse();

      // Call AI with conversation context
      const aiResponse = await quickChat(
        content,
        'You are a helpful AI assistant. Be concise and helpful. Always respond in English only.'
      );

      // Save assistant message
      const assistantMessage: Omit<ChatMessage, '_id'> = {
        threadId,
        userId: user.logtoId,
        role: 'Assistant',
        content: aiResponse,
        createdAt: new Date(),
      };

      const assistantResult = await ctx.db
        .collection('chat_messages')
        .insertOne(assistantMessage);

      // Update thread
      const isFirstMessage = (thread.messageCount as number) === 0;
      const updateData: Partial<ChatThread> = {
        updatedAt: new Date(),
        messageCount: (thread.messageCount as number) + 2, // User + Assistant
      };

      // Auto-generate title from first message
      if (isFirstMessage) {
        updateData.title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
      }

      await ctx.db
        .collection('chat_threads')
        .updateOne({ _id: new ObjectId(threadId) }, { $set: updateData });

      return {
        userMessage: {
          _id: userMsgResult.insertedId.toString(),
          ...userMessage,
        },
        assistantMessage: {
          _id: assistantResult.insertedId.toString(),
          ...assistantMessage,
        },
      };
    }),

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
      const thread = await ctx.db.collection('chat_threads').findOne({
        _id: new ObjectId(threadId),
        userId: user.logtoId,
      });

      if (!thread) {
        throw new Error('Thread not found or access denied');
      }

      // Build query
      const query: Record<string, unknown> = { threadId };
      if (before) {
        query.createdAt = { $lt: new Date(before) };
      }

      const messages = await ctx.db
        .collection('chat_messages')
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
        role: msg.role as 'User' | 'Assistant',
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

      const result = await ctx.db.collection('chat_threads').updateOne(
        {
          _id: new ObjectId(threadId),
          userId: user.logtoId,
        },
        {
          $set: { title, updatedAt: new Date() },
        }
      );

      if (result.matchedCount === 0) {
        throw new Error('Thread not found or access denied');
      }

      return { success: true };
    }),
});
