// Simple chat completion
function Chat(messages: ChatMessage[], system_prompt: string?) -> ChatResponse {
  client GLM46
  prompt #"
    {{ _.role("system") }}
    {{ system_prompt | default("You are a helpful AI assistant.") }}

    {% for message in messages %}
    {{ _.role(message.role) }}
    {{ message.content }}
    {% endfor %}

    {{ _.role("assistant") }}
    {{ ctx.output_format }}
  "#
}

// Chat with structured response
function StructuredChat(messages: ChatMessage[], system_prompt: string?, extract_sources: bool, suggest_followups: bool) -> StructuredChatResponse {
  client GLM46
  prompt #"
    {{ _.role("system") }}
    {{ system_prompt | default("You are a helpful AI assistant.") }}
    
    Instructions:
    - Provide a clear, helpful answer
    {% if extract_sources %}
    - Include any sources you reference
    {% endif %}
    {% if suggest_followups %}
    - Suggest 2-3 relevant follow-up questions
    {% endif %}

    {% for message in messages %}
    {{ _.role(message.role) }}
    {{ message.content }}
    {% endfor %}

    {{ _.role("assistant") }}
    {{ ctx.output_format }}
  "#
}

// Single-turn quick chat
function QuickChat(user_message: string, system_prompt: string?) -> string {
  client GLM46
  prompt #"
    {{ _.role("system") }}
    {{ system_prompt | default("You are a helpful AI assistant. Be concise and direct.") }}

    {{ _.role("user") }}
    {{ user_message }}

    {{ _.role("assistant") }}
  "#
}
