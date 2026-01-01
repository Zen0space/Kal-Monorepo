// Nutrition-related structured response
class NutritionAnalysis {
  food_items string[]
  estimated_calories int?
  health_notes string[]
  recommendations string[]
}

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
