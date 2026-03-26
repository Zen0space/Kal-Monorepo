/**
 * Chat Workflow Orchestrator
 *
 * Orchestrates the multi-step AI chat workflow and emits SSE events
 * so the frontend can show each step in real-time.
 *
 * Workflow:
 *   1. Save user message
 *   2. Classify intent (tool step)
 *   3. If food query → extract search term → search DB (tool steps)
 *   4. Stream AI response using the appropriate BAML function
 *   5. Save assistant message
 */

import type { ChatSSEEvent } from "kal-shared";
import {
  classifyIntent,
  extractFoodSearchTerm,
  estimateNutrition,
  UserIntent,
  streamFormatFoodResponse,
  streamFormatRecipeResponse,
  streamGeneralChat,
  streamFormatApiHelpResponse,
  parseRecipe,
  type RecipeIngredient,
} from "kal-baml";
import { ObjectId } from "mongodb";
import type { Db } from "mongodb";
import type { ChatMessage, ChatThread } from "kal-shared";

import { appRouter } from "../routers/index.js";
import { createCallerFactory } from "./trpc.js";

// ── tRPC server-side caller factory ──
const createCaller = createCallerFactory(appRouter);

// ── Unified result type (tagged with source) ──
interface FoodSearchResult {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving: string;
  category?: string;
  source: "halal" | "natural" | "estimated";
  brand?: string;
  halalCertifier?: string;
  halalCertYear?: number;
}

// ── Search foods via tRPC caller (hits both collections with caching) ──
async function searchFoods(
  db: Db,
  query: string,
  limit = 10
): Promise<FoodSearchResult[]> {
  const caller = createCaller({ db, user: null, userId: undefined });

  const [halalRaw, naturalRaw] = await Promise.all([
    caller.halal.search({ query }),
    caller.food.search({ query }),
  ]);

  const halalResults: FoodSearchResult[] = halalRaw.map((r) => ({
    id: r._id,
    name: r.name as string,
    calories: r.calories as number,
    protein: r.protein as number,
    carbs: r.carbs as number,
    fat: r.fat as number,
    serving: r.serving as string,
    category: r.category as string | undefined,
    source: "halal" as const,
    brand: r.brand as string | undefined,
    halalCertifier: r.halalCertifier as string | undefined,
    halalCertYear: r.halalCertYear as number | undefined,
  }));

  const naturalResults: FoodSearchResult[] = naturalRaw.map((r) => ({
    id: r._id,
    name: r.name as string,
    calories: r.calories as number,
    protein: r.protein as number,
    carbs: r.carbs as number,
    fat: r.fat as number,
    serving: r.serving as string,
    source: "natural" as const,
  }));

  // Halal first, then natural, capped at limit
  return [...halalResults, ...naturalResults].slice(0, limit);
}

// ── Format results into a string for the AI prompt ──
function formatFoodDataForPrompt(results: FoodSearchResult[]): string {
  if (results.length === 0) return "";

  return results
    .map((r) => {
      const parts = [
        `Name: ${r.name}`,
        `Calories: ${r.calories} kcal`,
        `Protein: ${r.protein}g`,
        `Carbs: ${r.carbs}g`,
        `Fat: ${r.fat}g`,
        `Serving: ${r.serving}`,
        `Source: ${r.source}`,
      ];
      if (r.brand) parts.push(`Brand: ${r.brand}`);
      if (r.halalCertifier) parts.push(`Halal Certifier: ${r.halalCertifier}`);
      if (r.halalCertYear) parts.push(`Halal Cert Year: ${r.halalCertYear}`);
      if (r.category) parts.push(`Category: ${r.category}`);
      return parts.join(" | ");
    })
    .join("\n");
}

// Store recent recipes in memory for quick reference (per thread)
const recentRecipes = new Map<
  string,
  { name: string; ingredients: Array<{ name: string; quantity: string }> }
>();

/**
 * Run the full chat workflow as an async generator that yields SSE events.
 *
 * The caller (SSE route) iterates over these events and writes them
 * to the HTTP response as Server-Sent Events.
 */
export async function* runChatWorkflow(params: {
  threadId: string;
  content: string;
  userId: string;
  db: Db;
}): AsyncGenerator<ChatSSEEvent, void, unknown> {
  const { threadId, content, userId, db } = params;
  const now = new Date();

  // ──────────────────────────────────────────────
  // Step 0: Verify thread ownership & save user message
  // ──────────────────────────────────────────────
  const thread = await db.collection("chat_threads").findOne({
    _id: new ObjectId(threadId),
    userId,
  });

  if (!thread) {
    yield { type: "error", message: "Thread not found or access denied" };
    yield { type: "done" };
    return;
  }

  // Save user message
  const userMessage: Omit<ChatMessage, "_id"> = {
    threadId,
    userId,
    role: "User",
    content,
    createdAt: now,
  };
  await db.collection("chat_messages").insertOne(userMessage);

  // Get recent conversation history
  const recentMessages = await db
    .collection("chat_messages")
    .find({ threadId })
    .sort({ createdAt: -1 })
    .limit(10)
    .toArray();
  recentMessages.reverse();

  const conversationContext = recentMessages
    .slice(-6)
    .map((m) => `${m.role}: ${(m.content as string).slice(0, 150)}`)
    .join("\n");

  // ──────────────────────────────────────────────
  // Step 1: Classify intent
  // ──────────────────────────────────────────────
  yield {
    type: "tool_start",
    tool: "classify_intent",
    message: "Understanding your question...",
  };

  let intentResult;
  try {
    intentResult = await classifyIntent(content, conversationContext);
    console.log(
      "[Workflow] Intent:",
      intentResult.intent,
      "Confidence:",
      intentResult.confidence
    );
  } catch (error) {
    console.warn("[Workflow] Intent classification failed:", error);
    // Default to FoodQuery — a DB search is cheap (cached via tRPC) and
    // harmless if nothing is found (falls through to general chat).
    intentResult = {
      intent: UserIntent.FoodQuery,
      confidence: 0.3,
      reasoning: "Fallback — intent classification failed, will search DB",
      extracted_food_terms: [] as string[],
      requires_api_lookup: true,
      requires_recipe_parse: false,
    };
  }

  const intentLabel =
    intentResult.intent === UserIntent.FoodQuery
      ? "Food nutrition query"
      : intentResult.intent === UserIntent.RecipeRequest
        ? "Recipe request"
        : intentResult.intent === UserIntent.RecipeNutrition
          ? "Recipe nutrition query"
          : intentResult.intent === UserIntent.ApiHelp
            ? "API documentation help"
            : intentResult.intent === UserIntent.Greeting
              ? "Greeting"
              : "General question";

  yield {
    type: "tool_end",
    tool: "classify_intent",
    message: intentLabel,
    data: {
      intent: intentResult.intent,
      confidence: intentResult.confidence,
      foodTerms: intentResult.extracted_food_terms,
    },
  };

  // ──────────────────────────────────────────────
  // Step 2: Route based on intent
  // ──────────────────────────────────────────────
  let foodData = "";
  let hasDbResults = false;
  let foodResults: FoodSearchResult[] = [];

  let needsFoodSearch =
    intentResult.intent === UserIntent.FoodQuery ||
    intentResult.requires_api_lookup;

  const isRecipeRequest = intentResult.intent === UserIntent.RecipeRequest;
  const isRecipeNutrition = intentResult.intent === UserIntent.RecipeNutrition;
  const isApiHelp = intentResult.intent === UserIntent.ApiHelp;

  // ApiHelp never needs food search
  if (isApiHelp) {
    needsFoodSearch = false;
  }

  // ── Food Query Path ──
  if (needsFoodSearch && !isRecipeRequest && !isRecipeNutrition) {
    // Extract search term
    yield {
      type: "tool_start",
      tool: "extract_search_term",
      message: "Extracting food name...",
    };

    let searchTerm: string;
    try {
      searchTerm = await extractFoodSearchTerm(content);
    } catch {
      // Fallback: use extracted food terms from intent or the raw message
      searchTerm =
        intentResult.extracted_food_terms?.[0] || content.toLowerCase();
    }

    yield {
      type: "tool_end",
      tool: "extract_search_term",
      message: `Searching for "${searchTerm}"`,
      data: { searchTerm },
    };

    // Search database
    yield {
      type: "tool_start",
      tool: "search_database",
      message: `Searching Kalori database for "${searchTerm}"...`,
    };

    foodResults = await searchFoods(db, searchTerm);
    hasDbResults = foodResults.length > 0;

    if (hasDbResults) {
      const halalCount = foodResults.filter((r) => r.source === "halal").length;
      const naturalCount = foodResults.filter(
        (r) => r.source === "natural"
      ).length;

      const parts: string[] = [];
      if (halalCount > 0) parts.push(`${halalCount} halal`);
      if (naturalCount > 0) parts.push(`${naturalCount} natural`);

      yield {
        type: "tool_end",
        tool: "search_database",
        message: `Found ${foodResults.length} results (${parts.join(", ")})`,
        data: {
          count: foodResults.length,
          halalCount,
          naturalCount,
          foods: foodResults.map((f) => f.name),
        },
      };

      foodData = formatFoodDataForPrompt(foodResults);
    } else {
      yield {
        type: "tool_end",
        tool: "search_database",
        message: `No results found for "${searchTerm}"`,
        data: { count: 0 },
      };

      // Try AI estimation
      yield {
        type: "tool_start",
        tool: "estimate_nutrition",
        message: `Estimating nutrition for "${searchTerm}"...`,
      };

      try {
        const estimated = await estimateNutrition(searchTerm);
        const estimatedResult: FoodSearchResult = {
          id: `estimated-${Date.now()}`,
          name: estimated.name,
          calories: estimated.calories,
          protein: estimated.protein,
          carbs: estimated.carbs,
          fat: estimated.fat,
          serving: estimated.serving,
          source: "estimated",
        };
        foodResults = [estimatedResult];
        foodData = formatFoodDataForPrompt(foodResults);

        yield {
          type: "tool_end",
          tool: "estimate_nutrition",
          message: "AI estimation ready (not from database)",
          data: { estimated: true },
        };
      } catch (error) {
        console.warn("[Workflow] Estimation failed:", error);
        yield {
          type: "tool_end",
          tool: "estimate_nutrition",
          message: "Not found — will respond as general chat",
        };
        // No food data at all — fall through to general chat formatter
        needsFoodSearch = false;
      }
    }
  }

  // ── Recipe Nutrition Path ──
  if (isRecipeNutrition) {
    const cachedRecipe = recentRecipes.get(threadId);
    if (cachedRecipe) {
      yield {
        type: "tool_start",
        tool: "search_database",
        message: `Looking up nutrition for ${cachedRecipe.ingredients.length} ingredients...`,
      };

      // Search ingredients in DB
      const ingredientResults: FoodSearchResult[] = [];
      for (const ing of cachedRecipe.ingredients) {
        const results = await searchFoods(db, ing.name, 1);
        if (results.length > 0) {
          ingredientResults.push(results[0]);
        } else {
          // Estimate
          try {
            const est = await estimateNutrition(ing.name, ing.quantity);
            ingredientResults.push({
              id: `estimated-${Date.now()}`,
              name: est.name,
              calories: est.calories,
              protein: est.protein,
              carbs: est.carbs,
              fat: est.fat,
              serving: est.serving,
              source: "estimated",
            });
          } catch {
            // Skip failed estimations
          }
        }
      }

      foodData = formatFoodDataForPrompt(ingredientResults);
      hasDbResults = ingredientResults.some((r) => r.source !== "estimated");

      yield {
        type: "tool_end",
        tool: "search_database",
        message: `Found nutrition for ${ingredientResults.length} ingredients`,
        data: { count: ingredientResults.length },
      };
    }
  }

  // ──────────────────────────────────────────────
  // Step 3: Stream AI response
  // ──────────────────────────────────────────────
  yield {
    type: "tool_start",
    tool: "generate_response",
    message: "Generating response...",
  };

  yield { type: "stream_start" };

  let fullResponse = "";

  try {
    let streamGen: AsyncGenerator<string, void, unknown>;

    if (isApiHelp) {
      // API documentation help → use FormatApiHelpResponse
      streamGen = streamFormatApiHelpResponse({
        userMessage: content,
        conversationContext,
      });
    } else if (isRecipeRequest || isRecipeNutrition) {
      // Recipe → use FormatRecipeResponse
      streamGen = streamFormatRecipeResponse({
        userMessage: content,
        ingredientNutrition: foodData || undefined,
        conversationContext,
      });
    } else if (needsFoodSearch) {
      // Food query → use FormatFoodResponse with strict DB data
      streamGen = streamFormatFoodResponse({
        userMessage: content,
        foodData: foodData || "No data available.",
        hasDbResults,
        conversationContext,
      });
    } else {
      // General chat / greeting → use StreamChat
      streamGen = streamGeneralChat({
        userMessage: content,
        conversationContext,
      });
    }

    for await (const chunk of streamGen) {
      if (chunk && typeof chunk === "string") {
        // BAML streaming yields cumulative text, so we need the delta
        const delta = chunk.slice(fullResponse.length);
        if (delta) {
          fullResponse = chunk;
          yield { type: "stream_delta", delta };
        }
      }
    }
  } catch (error) {
    console.error("[Workflow] Stream error:", error);
    if (!fullResponse) {
      fullResponse =
        "I'm sorry, I encountered an error generating a response. Please try again.";
      yield { type: "stream_delta", delta: fullResponse };
    }
  }

  yield {
    type: "tool_end",
    tool: "generate_response",
    message: "Response complete",
  };

  // ──────────────────────────────────────────────
  // Step 4: Save assistant message & update thread
  // ──────────────────────────────────────────────
  const assistantMessage: Omit<ChatMessage, "_id"> = {
    threadId,
    userId,
    role: "Assistant",
    content: fullResponse,
    createdAt: new Date(),
  };

  const assistantResult = await db
    .collection("chat_messages")
    .insertOne(assistantMessage);

  // If recipe response, try to cache it for future nutrition queries
  if (isRecipeRequest || fullResponse.toLowerCase().includes("ingredients")) {
    try {
      const parsed = await parseRecipe(fullResponse);
      if (parsed.ingredients.length > 0) {
        recentRecipes.set(threadId, {
          name: parsed.name,
          ingredients: parsed.ingredients.map((i: RecipeIngredient) => ({
            name: i.name,
            quantity: i.quantity,
          })),
        });
      }
    } catch {
      // Not a parseable recipe — that's fine
    }
  }

  // Update thread metadata
  const isFirstMessage = (thread.messageCount as number) === 0;
  const updateData: Partial<ChatThread> = {
    updatedAt: new Date(),
    messageCount: (thread.messageCount as number) + 2,
  };

  if (isFirstMessage) {
    updateData.title =
      content.slice(0, 50) + (content.length > 50 ? "..." : "");
  }

  await db
    .collection("chat_threads")
    .updateOne({ _id: new ObjectId(threadId) }, { $set: updateData });

  yield {
    type: "stream_end",
    messageId: assistantResult.insertedId.toString(),
  };

  yield { type: "done" };
}
