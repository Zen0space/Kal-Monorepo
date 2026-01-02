// ============================================
// Thinking & Reasoning Functions
// These functions help the AI "think" before responding
// ============================================

// Classify user intent to route to appropriate handler
function ClassifyIntent(
  user_message: string,
  conversation_context: string?
) -> IntentClassification {
  client GLM46
  prompt #"
    {{ _.role("system") }}
    You are an intent classifier for a nutrition and food assistant app called Kalori.
    Analyze the user's message and classify their intent.

    Available intents:
    - FoodQuery: User is asking about nutrition/calories of a specific food
    - RecipeRequest: User wants a recipe or cooking instructions
    - RecipeNutrition: User wants to know nutrition of a recipe they provided or we suggested
    - GeneralChat: General conversation not about food
    - Greeting: Simple hello/hi/thanks
    - Unknown: Cannot determine intent

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
  client GLM46
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

// Smart chat that uses conversation history
function SmartChat(
  messages: ChatMessage[],
  system_prompt: string?,
  food_context: string?,
  thread_summary: string?
) -> string {
  client GLM46
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
