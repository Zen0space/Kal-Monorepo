import { extractFoodSearchTerm, estimateNutrition, normalizeIngredientName } from 'kal-baml';

const BACKEND_PORT = process.env.BACKEND_PORT || '4000';
const API_BASE = process.env.API_URL || `http://localhost:${BACKEND_PORT}`;
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

export interface KaloriFoodResult {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving: string;
  category?: string;
  source?: 'halal' | 'natural' | 'estimated';
}

/**
 * Search for a single food item in both halal and natural databases
 * Returns halal results first, then natural foods as fallback
 */
export async function searchKaloriApi(query: string): Promise<KaloriFoodResult[]> {
  console.log('[Tool: api_checker] Extracting search term using AI...');
  const searchQuery = await extractFoodSearchTerm(query);
  console.log('[Tool: api_checker] AI extracted:', searchQuery);

  if (!searchQuery || searchQuery.trim() === '') {
    console.log('[Tool: api_checker] No food term extracted, skipping search');
    return [];
  }

  if (!INTERNAL_API_KEY) {
    console.log('[Tool: api_checker] Warning: INTERNAL_API_KEY not set');
    return [];
  }

  try {
    // Search halal foods first (branded/processed foods like Ramly, McD, etc.)
    console.log('[Tool: api_checker] Searching halal foods...');
    const halalRes = await fetch(`${API_BASE}/api/halal/search?q=${encodeURIComponent(searchQuery)}`, {
      headers: { 'X-API-Key': INTERNAL_API_KEY }
    });

    if (halalRes.ok) {
      const halalData = await halalRes.json() as { count?: number; data?: KaloriFoodResult[] };
      if (halalData.data && halalData.data.length > 0) {
        console.log('[Tool: api_checker] Found', halalData.count || 0, 'halal results');
        return halalData.data.map(f => ({ ...f, source: 'halal' as const }));
      }
    }

    // Fallback to natural foods if no halal results
    console.log('[Tool: api_checker] No halal results, searching natural foods...');
    const foodsRes = await fetch(`${API_BASE}/api/foods/search?q=${encodeURIComponent(searchQuery)}`, {
      headers: { 'X-API-Key': INTERNAL_API_KEY }
    });

    if (!foodsRes.ok) {
      console.log('[Tool: api_checker] API error:', foodsRes.status);
      return [];
    }

    const foodsData = await foodsRes.json() as { count?: number; data?: KaloriFoodResult[] };
    console.log('[Tool: api_checker] Found', foodsData.count || 0, 'natural food results');

    return (foodsData.data || []).map(f => ({ ...f, source: 'natural' as const }));
  } catch (error) {
    console.log('[Tool: api_checker] Error:', (error as Error).message);
    return [];
  }
}

/**
 * Search for multiple food items (e.g., recipe ingredients)
 * Searches both halal and natural databases and combines results
 * Uses AI normalization to improve search accuracy
 */
export async function searchMultipleFoods(foodNames: string[]): Promise<Map<string, KaloriFoodResult | null>> {
  const results = new Map<string, KaloriFoodResult | null>();

  if (!INTERNAL_API_KEY) {
    console.log('[Tool: api_checker] Warning: INTERNAL_API_KEY not set');
    foodNames.forEach(name => results.set(name, null));
    return results;
  }

  // Helper function to search a single query
  const searchSingleQuery = async (query: string): Promise<KaloriFoodResult | null> => {
    try {
      // Try halal first
      const halalRes = await fetch(`${API_BASE}/api/halal/search?q=${encodeURIComponent(query)}`, {
        headers: { 'X-API-Key': INTERNAL_API_KEY }
      });

      if (halalRes.ok) {
        const halalData = await halalRes.json() as { data?: KaloriFoodResult[] };
        if (halalData.data && halalData.data.length > 0) {
          return { ...halalData.data[0], source: 'halal' as const };
        }
      }

      // Try natural foods
      const foodsRes = await fetch(`${API_BASE}/api/foods/search?q=${encodeURIComponent(query)}`, {
        headers: { 'X-API-Key': INTERNAL_API_KEY }
      });

      if (foodsRes.ok) {
        const foodsData = await foodsRes.json() as { data?: KaloriFoodResult[] };
        if (foodsData.data && foodsData.data.length > 0) {
          return { ...foodsData.data[0], source: 'natural' as const };
        }
      }

      return null;
    } catch {
      return null;
    }
  };

  // Search all foods in parallel with progressive normalization
  const searchPromises = foodNames.map(async (foodName) => {
    const originalQuery = foodName.toLowerCase().trim();
    console.log(`[Tool: api_checker] Searching for: ${originalQuery}`);

    // Step 1: Try original name first
    let result = await searchSingleQuery(originalQuery);
    if (result) {
      console.log(`[Tool: api_checker] Found "${foodName}" with original query`);
      return { name: foodName, result };
    }

    // Step 2: If not found, normalize with AI and try again
    console.log(`[Tool: api_checker] Normalizing "${foodName}" with AI...`);
    const normalizedQuery = await normalizeIngredientName(foodName);

    if (normalizedQuery !== originalQuery) {
      console.log(`[Tool: api_checker] AI normalized: "${originalQuery}" -> "${normalizedQuery}"`);
      result = await searchSingleQuery(normalizedQuery);
      if (result) {
        console.log(`[Tool: api_checker] Found "${foodName}" with normalized query`);
        return { name: foodName, result };
      }
    }

    // Not found with either query
    console.log(`[Tool: api_checker] "${foodName}" not found in database`);
    return { name: foodName, result: null };
  });

  const searchResults = await Promise.all(searchPromises);
  searchResults.forEach(({ name, result }) => results.set(name, result));

  return results;
}

/**
 * Search for recipe ingredients and estimate nutrition for missing items
 * Returns nutrition data for all ingredients, using AI estimation when not found
 */
export async function searchRecipeIngredients(
  ingredients: Array<{ name: string; quantity: string }>
): Promise<Array<KaloriFoodResult & { originalName: string; quantity: string }>> {
  const results: Array<KaloriFoodResult & { originalName: string; quantity: string }> = [];

  // First, search for all ingredients in the database
  const foodNames = ingredients.map(i => i.name);
  const searchResults = await searchMultipleFoods(foodNames);

  // Process each ingredient
  for (const ingredient of ingredients) {
    const dbResult = searchResults.get(ingredient.name);

    if (dbResult) {
      // Found in database
      console.log(`[Tool: api_checker] Found "${ingredient.name}" in database`);
      results.push({
        ...dbResult,
        originalName: ingredient.name,
        quantity: ingredient.quantity,
      });
    } else {
      // Not found - use AI estimation
      console.log(`[Tool: api_checker] Estimating nutrition for "${ingredient.name}"`);
      try {
        const estimated = await estimateNutrition(ingredient.name, ingredient.quantity);
        results.push({
          id: `estimated-${Date.now()}`,
          name: estimated.name,
          calories: estimated.calories,
          protein: estimated.protein,
          carbs: estimated.carbs,
          fat: estimated.fat,
          serving: estimated.serving,
          source: 'estimated',
          originalName: ingredient.name,
          quantity: ingredient.quantity,
        });
      } catch (error) {
        console.log(`[Tool: api_checker] Failed to estimate "${ingredient.name}":`, error);
        // Add placeholder for failed estimation
        results.push({
          id: `unknown-${Date.now()}`,
          name: ingredient.name,
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          serving: ingredient.quantity,
          source: 'estimated',
          originalName: ingredient.name,
          quantity: ingredient.quantity,
        });
      }
    }
  }

  return results;
}

/**
 * Format nutrition results for display in chat
 */
export function formatNutritionForChat(foods: KaloriFoodResult[]): string {
  if (foods.length === 0) return '';

  return foods.map(f => {
    const source = f.source === 'estimated' ? ' (estimated)' : '';
    return `- ${f.name}${source}: ${f.calories} cal, ${f.protein}g protein, ${f.carbs}g carbs, ${f.fat}g fat (serving: ${f.serving})`;
  }).join('\n');
}

/**
 * Calculate total nutrition from multiple food items
 */
export function calculateTotalNutrition(foods: KaloriFoodResult[]): {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  itemCount: number;
  hasEstimates: boolean;
} {
  const totals = foods.reduce(
    (acc, food) => ({
      totalCalories: acc.totalCalories + food.calories,
      totalProtein: acc.totalProtein + food.protein,
      totalCarbs: acc.totalCarbs + food.carbs,
      totalFat: acc.totalFat + food.fat,
      itemCount: acc.itemCount + 1,
      hasEstimates: acc.hasEstimates || food.source === 'estimated',
    }),
    { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0, itemCount: 0, hasEstimates: false }
  );

  return {
    ...totals,
    totalProtein: Math.round(totals.totalProtein * 10) / 10,
    totalCarbs: Math.round(totals.totalCarbs * 10) / 10,
    totalFat: Math.round(totals.totalFat * 10) / 10,
  };
}

// Simple heuristic to detect food-related queries
export function isFoodQuery(message: string): boolean {
  const foodKeywords = [
    'calori', 'kalori', 'nutrition', 'protein', 'carb', 'fat',
    'food', 'eat', 'meal', 'breakfast', 'lunch', 'dinner',
    'nasi', 'burger', 'ayam', 'ikan', 'daging', 'sayur',
    'ramly', 'mcd', 'kfc', 'milo', 'teh', 'kopi',
    'recipe', 'resipi', 'masak', 'cook', 'ingredient'
  ];

  const lowerMessage = message.toLowerCase();
  return foodKeywords.some(keyword => lowerMessage.includes(keyword));
}

// Detect if user is asking about a recipe's nutrition
export function isRecipeNutritionQuery(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  const recipeKeywords = ['recipe', 'resipi', 'this recipe', 'for this', 'ingredients'];
  const nutritionKeywords = ['nutrition', 'calories', 'kalori', 'protein', 'carbs', 'fat'];

  const hasRecipeKeyword = recipeKeywords.some(k => lowerMessage.includes(k));
  const hasNutritionKeyword = nutritionKeywords.some(k => lowerMessage.includes(k));

  return hasRecipeKeyword && hasNutritionKeyword;
}
