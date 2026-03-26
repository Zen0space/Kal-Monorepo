// ============================================
// Thinking & Reasoning Functions
// These functions help the AI "think" before responding
// ============================================

// Classify user intent to route to appropriate handler
function ClassifyIntent(
  user_message: string,
  conversation_context: string?
) -> IntentClassification {
  client Claude
  prompt #"
    {{ _.role("system") }}
    You are an intent classifier for a nutrition and food assistant app called Kalori.
    Analyze the user's message and classify their intent.

    Available intents:
    - FoodQuery: User is asking about nutrition/calories of a specific food. This includes ANY mention of a food item even without explicit nutrition keywords (e.g. "nasi lemak", "tell me about roti canai", "what about ayam goreng").
    - RecipeRequest: User wants a recipe or cooking instructions (e.g. "how to cook", "recipe for", "cara masak")
    - RecipeNutrition: User wants to know nutrition of a recipe they provided or we suggested (e.g. "nutrition for this recipe", "calories of those ingredients")
    - ApiHelp: User is asking about API endpoints, how to integrate Kalori data into their own app, API documentation, API keys, or developer-related questions (e.g. "give me the API endpoint", "how do I use the API", "I want to fetch nasi lemak data in my app", "API for food data", "how to get API key", "show me the docs")
    - GeneralChat: General conversation not about food (e.g. "what can you do?", "tell me a joke")
    - Greeting: Simple hello/hi/thanks/bye
    - Unknown: Cannot determine intent

    IMPORTANT classification rules:
    - If the message mentions ANY specific food name (Malaysian or international), classify as FoodQuery even without words like "calories" or "nutrition"
    - EXCEPTION: If the message mentions food in the context of API/endpoint/integration (e.g. "API endpoint for nasi lemak", "fetch nasi lemak data"), classify as ApiHelp NOT FoodQuery
    - Malaysian food names to watch for: nasi, mee, roti, ayam, ikan, daging, sayur, kuih, teh, kopi, milo, sambal, rendang, laksa, satay, char kuey teow, etc.
    - Brand/restaurant names count as FoodQuery: Ramly, McD, KFC, Starbucks, Tealive, etc.
    - "How healthy is X" or "is X good for diet" = FoodQuery
    - "API endpoint for X" or "how to get X data in my app" = ApiHelp
    - Set requires_api_lookup=true for ALL FoodQuery and RecipeNutrition intents
    - Set requires_recipe_parse=true for RecipeRequest and RecipeNutrition intents
    - Extract ALL food terms mentioned, even partial matches

    {% if conversation_context %}
    Recent conversation context:
    {{ conversation_context }}
    {% endif %}

    {{ _.role("user") }}
    {{ user_message }}

    {{ _.role("assistant") }}
    {{ ctx.output_format }}
  "#
}

// Think through a complex problem step by step
function Think(
  problem: string,
  context: string?,
  available_data: string?
) -> ThinkingResult {
  client Claude
  prompt #"
    {{ _.role("system") }}
    You are a thoughtful AI assistant. Think through the problem step by step.
    Show your reasoning process clearly.

    {% if context %}
    Context: {{ context }}
    {% endif %}

    {% if available_data %}
    Available data to consider:
    {{ available_data }}
    {% endif %}

    {{ _.role("user") }}
    {{ problem }}

    {{ _.role("assistant") }}
    {{ ctx.output_format }}
  "#
}

// Smart chat that uses conversation history (kept for backward compatibility)
function SmartChat(
  messages: ChatMessage[],
  system_prompt: string?,
  food_context: string?,
  thread_summary: string?
) -> string {
  client Claude
  prompt #"
    {{ _.role("system") }}
    {{ system_prompt | default("You are Kal, a helpful AI nutrition assistant. Always respond in English only. Be friendly and helpful.") }}

    {% if thread_summary %}
    Previous conversation summary:
    {{ thread_summary }}
    {% endif %}

    {% if food_context %}

    Nutrition data from Kalori database (use this for accurate answers):
    {{ food_context }}
    {% endif %}

    {% for message in messages %}
    {{ _.role(message.role) }}
    {{ message.content }}
    {% endfor %}

    {{ _.role("assistant") }}
  "#
}
