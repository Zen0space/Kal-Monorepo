import { b } from '../baml_client/baml_client/index.js';
import {
  Role,
  UserIntent,
  type ChatMessage,
  type ChatResponse,
  type StructuredChatResponse,
  type NutritionAnalysis,
  type NutritionItem,
  type NutritionSummary,
  type ParsedRecipe,
  type IntentClassification,
  type ThinkingResult,
} from '../baml_client/baml_client/types.js';

// ============================================
// Type Exports
// ============================================

export interface ChatInput {
  messages: Array<{ role: 'User' | 'Assistant' | 'System'; content: string }>;
  systemPrompt?: string;
}

export interface ChatResult {
  success: boolean;
  data?: ChatResponse;
  error?: string;
}

export interface SmartChatInput {
  messages: Array<{ role: 'User' | 'Assistant' | 'System'; content: string }>;
  systemPrompt?: string;
  foodContext?: string;
  threadSummary?: string;
}

// ============================================
// Helper Functions
// ============================================



function toMessages(
  messages: Array<{ role: 'User' | 'Assistant' | 'System'; content: string }>
): ChatMessage[] {
  return messages.map((m) => ({
    role: m.role.toLowerCase(),
    content: m.content,
  }));
}

// ============================================
// Core Chat Functions
// ============================================

/**
 * Send a chat message and get a response
 */
export async function chat(input: ChatInput): Promise<ChatResult> {
  try {
    const messages = toMessages(input.messages);
    const response = await b.Chat(messages, input.systemPrompt ?? null);
    return { success: true, data: response };
  } catch (error) {
    console.error('[kal-baml] Chat error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Quick single-turn chat
 */
export async function quickChat(
  message: string,
  systemPrompt?: string
): Promise<string> {
  const response = await b.QuickChat(message, systemPrompt ?? null);
  return response;
}

/**
 * Smart chat with conversation context, food data, and thread summary
 */
export async function smartChat(input: SmartChatInput): Promise<string> {
  const messages = toMessages(input.messages);
  return await b.SmartChat(
    messages,
    input.systemPrompt ?? null,
    input.foodContext ?? null,
    input.threadSummary ?? null
  );
}

/**
 * Structured chat with sources and follow-ups
 */
export async function structuredChat(
  input: ChatInput & { extractSources?: boolean; suggestFollowups?: boolean }
): Promise<StructuredChatResponse> {
  const messages = toMessages(input.messages);
  return await b.StructuredChat(
    messages,
    input.systemPrompt ?? null,
    input.extractSources ?? false,
    input.suggestFollowups ?? false
  );
}

/**
 * Stream a quick chat response chunk by chunk
 */
export async function* streamQuickChat(
  message: string,
  systemPrompt?: string
): AsyncGenerator<string, void, unknown> {
  try {
    const stream = b.stream.QuickChat(message, systemPrompt ?? null);

    for await (const chunk of stream) {
      if (chunk && typeof chunk === 'string') {
        yield chunk;
      }
    }
  } catch (error) {
    console.error('[kal-baml] Stream error:', error);
    throw error;
  }
}

// ============================================
// Thinking & Intent Functions
// ============================================

/**
 * Classify user intent for routing
 */
export async function classifyIntent(
  message: string,
  conversationContext?: string
): Promise<IntentClassification> {
  return await b.ClassifyIntent(message, conversationContext ?? null);
}

/**
 * Think through a complex problem
 */
export async function think(
  problem: string,
  context?: string,
  availableData?: string
): Promise<ThinkingResult> {
  return await b.Think(problem, context ?? null, availableData ?? null);
}

// ============================================
// Recipe Functions
// ============================================

/**
 * Parse a recipe and extract ingredients
 */
export async function parseRecipe(recipeText: string): Promise<ParsedRecipe> {
  return await b.ParseRecipe(recipeText);
}

/**
 * Generate a recipe based on main ingredient
 */
export async function generateRecipe(
  mainIngredient: string,
  preferences?: string,
  dietaryRestrictions?: string
): Promise<ParsedRecipe> {
  return await b.GenerateRecipe(
    mainIngredient,
    preferences ?? null,
    dietaryRestrictions ?? null
  );
}

/**
 * Extract food search term from user message using AI
 */
export async function extractFoodSearchTerm(message: string): Promise<string> {
  try {
    const term = await b.ExtractFoodSearchTerm(message);
    return term.trim().toLowerCase();
  } catch (error) {
    console.error('[kal-baml] Extract food term error:', error);
    return message;
  }
}

/**
 * Normalize ingredient name for database search
 * Removes preparation words (patty, slice), cooking methods (fried, grilled),
 * and state words (fresh, frozen) while keeping brand names and core food identity
 */
export async function normalizeIngredientName(ingredientName: string): Promise<string> {
  try {
    const normalized = await b.NormalizeIngredientName(ingredientName);
    return normalized.trim().toLowerCase();
  } catch (error) {
    console.error('[kal-baml] Normalize ingredient error:', error);
    return ingredientName.toLowerCase();
  }
}

// ============================================
// Nutrition Functions
// ============================================

/**
 * Analyze food description for nutrition info
 */
export async function analyzeFood(
  description: string
): Promise<NutritionAnalysis> {
  return await b.AnalyzeFood(description);
}

/**
 * Estimate nutrition for a food item not in database
 */
export async function estimateNutrition(
  foodName: string,
  quantity?: string
): Promise<NutritionItem> {
  return await b.EstimateNutrition(foodName, quantity ?? null);
}

/**
 * Summarize nutrition from multiple ingredients
 */
export async function summarizeNutrition(
  recipeName: string,
  ingredientsData: string,
  servings?: number
): Promise<NutritionSummary> {
  return await b.SummarizeNutrition(
    recipeName,
    ingredientsData,
    servings ?? null
  );
}

// ============================================
// Re-export types and enums
// ============================================

export { Role, UserIntent };
export type {
  ChatMessage,
  ChatResponse,
  StructuredChatResponse,
  NutritionAnalysis,
  NutritionItem,
  NutritionSummary,
  ParsedRecipe,
  IntentClassification,
  ThinkingResult,
};
