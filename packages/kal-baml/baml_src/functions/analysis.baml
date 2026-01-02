// ============================================
// Nutrition Analysis Functions
// ============================================

// Analyze food from text description
function AnalyzeFood(description: string) -> NutritionAnalysis {
  client GLM46
  prompt #"
    {{ _.role("system") }}
    You are a nutrition expert. Analyze the food described and provide
    structured nutritional information. Be accurate and helpful.

    {{ _.role("user") }}
    {{ description }}

    {{ _.role("assistant") }}
    {{ ctx.output_format }}
  "#
}

// Estimate nutrition when not found in database
function EstimateNutrition(
  food_name: string,
  quantity: string?
) -> NutritionItem {
  client GLM46
  prompt #"
    {{ _.role("system") }}
    You are a nutrition expert. Estimate the nutrition for this food item.
    Be as accurate as possible based on standard nutritional data.
    Always set source to "estimated".

    {% if quantity %}
    Quantity: {{ quantity }}
    {% else %}
    Use a standard serving size.
    {% endif %}

    {{ _.role("user") }}
    {{ food_name }}

    {{ _.role("assistant") }}
    {{ ctx.output_format }}
  "#
}
