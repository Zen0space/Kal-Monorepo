// Chat message roles - enum values must start with uppercase
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

// Chat response with metadata
class ChatResponse {
  content string
  thinking string?         // For chain-of-thought if needed
  confidence float?        // Optional confidence score
}

// Structured chat response for specific use cases
class StructuredChatResponse {
  answer string
  sources string[]        // Empty array if no sources
  follow_up_questions string[]  // Empty array if no follow-ups
}
