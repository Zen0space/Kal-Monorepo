// ============================================
// Streaming-optimized chat functions
// Used for non-food general conversation queries
// ============================================

// General streaming chat for greetings, general questions, etc.
function StreamChat(
  user_message: string,
  system_prompt: string?,
  conversation_context: string?
) -> string {
  client Claude
  prompt #"
    {{ _.role("system") }}
    {{ system_prompt | default("You are Kal, a friendly Malaysian food nutrition AI assistant. Always respond in English. Be concise and helpful. If the user asks about food nutrition, let them know you can look up accurate data from the Kalori database.") }}

    {% if conversation_context %}
    Recent conversation:
    {{ conversation_context }}
    {% endif %}

    {{ _.role("user") }}
    {{ user_message }}

    {{ _.role("assistant") }}
  "#
}
