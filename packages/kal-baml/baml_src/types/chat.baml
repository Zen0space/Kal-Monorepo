// ============================================
// Core Chat Types
// ============================================

// Chat message roles
enum Role {
  User
  Assistant
  System
}

// Single chat message
class ChatMessage {
  role Role
  content string
}

// Basic chat response with optional thinking
class ChatResponse {
  content string
  thinking string?         // Chain-of-thought reasoning
  confidence float?        // Optional confidence score
}

// Structured chat response for specific use cases
class StructuredChatResponse {
  answer string
  sources string[]              // Empty array if no sources
  follow_up_questions string[]  // Empty array if no follow-ups
}

// ============================================
// Nutrition Types
// ============================================

// Single nutrition item (from API or estimated)
class NutritionItem {
  name string
  calories int
  protein float
  carbs float
  fat float
  serving string
  source string           // "api" or "estimated"
}

// Nutrition analysis result
class NutritionAnalysis {
  food_items string[]
  estimated_calories int?
  health_notes string[]
  recommendations string[]
}

// Combined nutrition summary for recipes
class NutritionSummary {
  items NutritionItem[]
  total_calories int
  total_protein float
  total_carbs float
  total_fat float
  per_serving string?
  notes string[]
}

// ============================================
// Recipe Types
// ============================================

// Single ingredient with quantity
class RecipeIngredient {
  name string              // Food name for API search
  quantity string          // e.g., "100g", "1 piece", "2 tbsp"
  original_text string     // Original text from recipe
}

// Parsed recipe structure
class ParsedRecipe {
  name string
  ingredients RecipeIngredient[]
  servings int?
  prep_notes string[]
}

// ============================================
// Thinking/Reasoning Types
// ============================================

// Intent classification for routing
enum UserIntent {
  FoodQuery              // Asking about food nutrition
  RecipeRequest          // Asking for a recipe
  RecipeNutrition        // Asking about nutrition of a recipe
  GeneralChat            // General conversation
  Greeting               // Simple greeting
  Unknown                // Unable to classify
}

// Classified user intent with reasoning
class IntentClassification {
  intent UserIntent
  confidence float
  reasoning string
  extracted_food_terms string[]   // Any food terms found
  requires_api_lookup bool        // Should we search the API?
  requires_recipe_parse bool      // Should we parse a recipe?
}

// Thought process for complex reasoning
class ThinkingResult {
  thinking string          // Step-by-step reasoning
  conclusion string        // Final answer/decision
  confidence float
  next_actions string[]    // Suggested next steps
}
