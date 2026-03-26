// Re-export all BAML generated types and functions
export * from "../baml_client/baml_client/index.js";

// Export convenience wrapper functions
export {
  // Core chat
  chat,
  quickChat,
  smartChat,
  streamQuickChat,
  structuredChat,
  // Agent workflow (NEW)
  formatFoodResponse,
  streamFormatFoodResponse,
  formatRecipeResponse,
  streamFormatRecipeResponse,
  streamGeneralChat,
  generalChat,
  formatApiHelpResponse,
  streamFormatApiHelpResponse,
  // Thinking & Intent
  classifyIntent,
  think,
  // Recipe
  parseRecipe,
  generateRecipe,
  extractFoodSearchTerm,
  normalizeIngredientName,
  // Nutrition
  analyzeFood,
  estimateNutrition,
  summarizeNutrition,
  // Enums
  Role,
  UserIntent,
} from "./chat.js";

// Export types
export type {
  ChatInput,
  ChatResult,
  SmartChatInput,
  ChatMessage,
  ChatResponse,
  StructuredChatResponse,
  NutritionAnalysis,
  NutritionItem,
  NutritionSummary,
  ParsedRecipe,
  IntentClassification,
  ThinkingResult,
} from "./chat.js";
