import {
  smartChat,
  classifyIntent,
  parseRecipe,
  type ParsedRecipe,
  UserIntent,
} from 'kal-baml';
import type { ChatMessage, ChatThread, ChatThreadPreview } from 'kal-shared';
import { ObjectId } from 'mongodb';
import { z } from 'zod';

import {
  isFoodQuery,
  isRecipeNutritionQuery,
  searchKaloriApi,
  searchRecipeIngredients,
  formatNutritionForChat,
  calculateTotalNutrition,
} from '../lib/kalori-api-tool.js';
import { router, protectedProcedure } from '../lib/trpc.js';

// Helper to ensure user is authenticated
function requireUser(user: { logtoId: string } | null): { logtoId: string } {
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

// Store recent recipes in memory for quick reference (per thread)
const recentRecipes = new Map<string, ParsedRecipe>();

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

      // Clear any cached recipes for this thread
      recentRecipes.delete(threadId);

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

      console.log('[Chat] sendMessage called:', {
        user: user.logtoId,
        threadId,
        content: content.slice(0, 50),
      });

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

      console.log(
        '[Chat] User message saved:',
        userMsgResult.insertedId.toString()
      );

      // Get recent conversation history for context (last 10 messages)
      const recentMessages = await ctx.db
        .collection('chat_messages')
        .find({ threadId })
        .sort({ createdAt: -1 })
        .limit(10)
        .toArray();

      // Reverse to chronological order
      recentMessages.reverse();

      // Build conversation context for intent classification
      const conversationContext = recentMessages
        .slice(-5)
        .map((m) => `${m.role}: ${(m.content as string).slice(0, 100)}`)
        .join('\n');

      // Classify intent to determine how to handle the message
      console.log('[Thinking] Classifying user intent...');
      let intentResult;
      try {
        intentResult = await classifyIntent(content, conversationContext);
        console.log('[Thinking] Intent:', intentResult.intent, 'Confidence:', intentResult.confidence);
      } catch (error) {
        console.log('[Thinking] Intent classification failed, using fallback');
        intentResult = {
          intent: UserIntent.GeneralChat,
          confidence: 0.5,
          reasoning: 'Fallback',
          extracted_food_terms: [],
          requires_api_lookup: isFoodQuery(content),
          requires_recipe_parse: false,
        };
      }

      // Process based on intent
      let foodContext = '';
      let recipeContext = '';

      // Check if user is asking about a recipe's nutrition
      if (isRecipeNutritionQuery(content)) {
        console.log('[Tool: recipe] Recipe nutrition query detected');

        // Check if we have a recent recipe for this thread
        const cachedRecipe = recentRecipes.get(threadId);

        if (cachedRecipe) {
          console.log('[Tool: recipe] Using cached recipe:', cachedRecipe.name);

          // Search for all ingredients
          const ingredients = cachedRecipe.ingredients.map((i) => ({
            name: i.name,
            quantity: i.quantity,
          }));

          console.log('[Tool: recipe] Searching nutrition for', ingredients.length, 'ingredients');
          const nutritionResults = await searchRecipeIngredients(ingredients);

          // Calculate totals
          const totals = calculateTotalNutrition(nutritionResults);

          // Format for context
          foodContext = `Recipe: ${cachedRecipe.name}\n\nIngredient nutrition:\n${formatNutritionForChat(nutritionResults)}`;
          foodContext += `\n\n**Total Nutrition:**\n- Calories: ${totals.totalCalories} cal\n- Protein: ${totals.totalProtein}g\n- Carbs: ${totals.totalCarbs}g\n- Fat: ${totals.totalFat}g`;
          if (totals.hasEstimates) {
            foodContext += '\n\n_Note: Some values are AI estimates as the ingredients were not found in our database._';
          }
        } else {
          // Try to find a recipe in recent messages
          console.log('[Tool: recipe] No cached recipe, looking in conversation...');

          // Look for recipe in recent assistant messages
          const recentAssistantMessages = recentMessages
            .filter((m) => m.role === 'Assistant')
            .slice(-3);

          for (const msg of recentAssistantMessages) {
            const msgContent = msg.content as string;
            if (
              msgContent.includes('Ingredients') ||
              msgContent.includes('Recipe')
            ) {
              console.log('[Tool: recipe] Found recipe in conversation, parsing...');
              try {
                const parsedRecipe = await parseRecipe(msgContent);
                recentRecipes.set(threadId, parsedRecipe);

                // Search for all ingredients
                const ingredients = parsedRecipe.ingredients.map((i) => ({
                  name: i.name,
                  quantity: i.quantity,
                }));

                console.log('[Tool: recipe] Searching nutrition for', ingredients.length, 'ingredients');
                const nutritionResults = await searchRecipeIngredients(ingredients);
                const totals = calculateTotalNutrition(nutritionResults);

                foodContext = `Recipe: ${parsedRecipe.name}\n\nIngredient nutrition:\n${formatNutritionForChat(nutritionResults)}`;
                foodContext += `\n\n**Total Nutrition:**\n- Calories: ${totals.totalCalories} cal\n- Protein: ${totals.totalProtein}g\n- Carbs: ${totals.totalCarbs}g\n- Fat: ${totals.totalFat}g`;
                if (totals.hasEstimates) {
                  foodContext += '\n\n_Note: Some values are AI estimates._';
                }
                break;
              } catch (error) {
                console.log('[Tool: recipe] Failed to parse recipe:', error);
              }
            }
          }
        }
      }
      // Handle recipe requests - save for later nutrition queries
      else if (
        intentResult.intent === UserIntent.RecipeRequest ||
        content.toLowerCase().includes('recipe')
      ) {
        console.log('[Tool: recipe] Recipe request detected');
        recipeContext = 'User is asking for a recipe. After providing the recipe, they may ask about its nutrition.';
      }
      // Handle food queries
      else if (
        intentResult.requires_api_lookup ||
        isFoodQuery(content)
      ) {
        console.log('[Tool: api_checker] Food query detected, searching API...');
        const foodResults = await searchKaloriApi(content);

        if (foodResults.length > 0) {
          foodContext = formatNutritionForChat(foodResults);
          console.log('[Tool: api_checker] Added', foodResults.length, 'results to context');
        }
      }

      // Build messages for SmartChat
      const chatMessages = recentMessages.map((m) => ({
        role: m.role as 'User' | 'Assistant' | 'System',
        content: m.content as string,
      }));

      // Build enhanced system prompt
      const systemPrompt = `You are Kal, a helpful AI nutrition assistant powered by Kalori. You help users with:
- Food nutrition information (calories, protein, carbs, fat)
- Recipe suggestions with Malaysian/halal food focus
- Healthy eating advice

Always respond in English. Be friendly, concise, and accurate.
${recipeContext}`;

      // Generate AI response using SmartChat with full context
      console.log('[Streaming] Generating AI response with SmartChat...');
      let aiResponse = await smartChat({
        messages: chatMessages,
        systemPrompt,
        foodContext: foodContext || undefined,
      });
      console.log('[Streaming] Response generated:', aiResponse.slice(0, 50) + '...');

      // If this was a recipe response, parse it and append nutrition summary
      if (
        intentResult.intent === UserIntent.RecipeRequest ||
        aiResponse.toLowerCase().includes('ingredients')
      ) {
        try {
          const parsedRecipe = await parseRecipe(aiResponse);
          if (parsedRecipe.ingredients.length > 0) {
            console.log('[Tool: recipe] Caching recipe:', parsedRecipe.name);
            recentRecipes.set(threadId, parsedRecipe);

            // Calculate nutrition for all ingredients
            console.log('[Tool: recipe] Calculating nutrition for', parsedRecipe.ingredients.length, 'ingredients');
            const ingredients = parsedRecipe.ingredients.map((i) => ({
              name: i.name,
              quantity: i.quantity,
            }));

            const nutritionResults = await searchRecipeIngredients(ingredients);
            const totals = calculateTotalNutrition(nutritionResults);

            // Build nutrition summary
            let nutritionSummary = '\n\n---\n\n**Nutrition Summary (estimated per serving):**\n';
            nutritionSummary += `- **Calories:** ${totals.totalCalories} cal\n`;
            nutritionSummary += `- **Protein:** ${totals.totalProtein}g\n`;
            nutritionSummary += `- **Carbs:** ${totals.totalCarbs}g\n`;
            nutritionSummary += `- **Fat:** ${totals.totalFat}g\n`;

            if (totals.hasEstimates) {
              nutritionSummary += '\n_Some values are estimated as ingredients were not found in our database._';
            }

            // Append to response
            aiResponse += nutritionSummary;
            console.log('[Tool: recipe] Nutrition summary appended');
          }
        } catch (error) {
          console.log('[Tool: recipe] Failed to parse/calculate nutrition:', error);
          // Not a recipe or failed to parse - that's okay
        }
      }

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
        updateData.title =
          content.slice(0, 50) + (content.length > 50 ? '...' : '');
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
