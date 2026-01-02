// ============================================
// Recipe Functions
// Parse recipes and extract ingredients for nutrition lookup
// ============================================

// Parse a recipe text and extract ingredients
function ParseRecipe(recipe_text: string) -> ParsedRecipe {
  client GLM46
  prompt #"
    {{ _.role("system") }}
    You are a recipe parser. Extract the recipe name and ingredients from the text.
    For each ingredient, provide:
    - name: The searchable food name (e.g., "chicken breast", "ramly beef burger", "white rice")
    - quantity: The amount (e.g., "100g", "1 piece", "2 tablespoons")
    - original_text: The original ingredient text

    Tips for ingredient names:
    - Keep brand names: "Ramly Beef Burger" not just "beef burger"
    - Be specific: "chicken breast" not just "chicken"
    - Include cooking method if relevant: "fried egg" vs "boiled egg"

    {{ _.role("user") }}
    {{ recipe_text }}

    {{ _.role("assistant") }}
    {{ ctx.output_format }}
  "#
}

// Generate a recipe based on available ingredients
function GenerateRecipe(
  main_ingredient: string,
  preferences: string?,
  dietary_restrictions: string?
) -> ParsedRecipe {
  client GLM46
  prompt #"
    {{ _.role("system") }}
    You are a Malaysian cooking expert. Generate a simple, practical recipe.
    Focus on common ingredients available in Malaysia.

    {% if preferences %}
    User preferences: {{ preferences }}
    {% endif %}

    {% if dietary_restrictions %}
    Dietary restrictions: {{ dietary_restrictions }}
    {% endif %}

    For ingredients, provide:
    - name: Searchable food name for nutrition database
    - quantity: Amount needed
    - original_text: How to describe it in recipe

    {{ _.role("user") }}
    Create a recipe using {{ main_ingredient }}

    {{ _.role("assistant") }}
    {{ ctx.output_format }}
  "#
}

// Extract food search terms from any text (improved version)
function ExtractFoodSearchTerm(user_message: string) -> string {
  client GLM46
  prompt #"
    {{ _.role("system") }}
    You are a food search term extractor for a Malaysian nutrition database.
    Extract ONLY the food name that should be searched.

    Rules:
    - Return ONLY the food name, nothing else
    - Remove words like "calories", "nutrition", "protein", "how many", "what is", etc.
    - Keep brand names: "Ramly", "McDonalds", "KFC", "Gardenia"
    - Keep Malaysian food names: "nasi lemak", "roti canai", "teh tarik"
    - For compound foods, keep them together: "nasi lemak ayam goreng"
    - Return in lowercase
    - If multiple foods mentioned, pick the main one

    Examples:
    - "tell me about ramly burger beef calories" -> "ramly beef burger"
    - "how many calories in nasi lemak?" -> "nasi lemak"
    - "what's the nutrition for mcd mcnuggets" -> "mcd mcnuggets"
    - "protein in grilled chicken breast" -> "grilled chicken breast"
    - "for this recipe tell me the nutritions" -> "" (no specific food)

    {{ _.role("user") }}
    {{ user_message }}

    {{ _.role("assistant") }}
  "#
}

// Normalize ingredient name for database search
// This function cleans up recipe ingredient names to match database entries
function NormalizeIngredientName(ingredient_name: string) -> string {
  client GLM46
  prompt #"
    {{ _.role("system") }}
    You are a food database search optimizer. Convert recipe ingredient names to simple, searchable food names that would match a nutrition database.

    Rules:
    1. Remove preparation words: patty, piece, slice, fillet, whole, strips, chunks, cubes, diced, minced, chopped, sliced
    2. Remove cooking methods: raw, cooked, fried, grilled, boiled, steamed, baked, roasted, sauteed
    3. Remove state words: fresh, frozen, canned, dried, thawed
    4. Keep brand names: "Ramly", "McD", "KFC", "Gardenia", "Maggi"
    5. Keep the core food identity
    6. Return in lowercase
    7. Return ONLY the normalized name, nothing else

    Examples:
    - "Ramly beef burger patty" -> "ramly beef burger"
    - "chicken breast fillet" -> "chicken breast"
    - "diced onion" -> "onion"
    - "fresh broccoli florets" -> "broccoli"
    - "fried egg" -> "egg" (keep simple unless brand)
    - "Gardenia bread slice" -> "gardenia bread"
    - "minced garlic" -> "garlic"
    - "coconut milk" -> "coconut milk" (keep as is, it's a distinct product)
    - "vegetable oil" -> "vegetable oil"
    - "soy sauce" -> "soy sauce"

    {{ _.role("user") }}
    {{ ingredient_name }}

    {{ _.role("assistant") }}
  "#
}

// Summarize nutrition from multiple ingredients
function SummarizeNutrition(
  recipe_name: string,
  ingredients_data: string,
  servings: int?
) -> NutritionSummary {
  client GLM46
  prompt #"
    {{ _.role("system") }}
    You are a nutrition calculator. Given ingredient nutrition data, calculate totals.

    For items not found in the database, provide reasonable estimates based on:
    - Standard serving sizes
    - Common nutritional values for similar foods
    - Mark estimated items with source: "estimated"

    {% if servings %}
    Recipe makes {{ servings }} servings. Calculate per-serving values too.
    {% endif %}

    {{ _.role("user") }}
    Recipe: {{ recipe_name }}

    Ingredient data:
    {{ ingredients_data }}

    {{ _.role("assistant") }}
    {{ ctx.output_format }}
  "#
}
