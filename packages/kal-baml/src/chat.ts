import { b } from '../baml_client/baml_client/index.js';
import {
  Role,
  type ChatMessage,
  type ChatResponse,
  type StructuredChatResponse,
  type NutritionAnalysis,
} from '../baml_client/baml_client/types.js';

export interface ChatInput {
  messages: Array<{ role: 'User' | 'Assistant' | 'System'; content: string }>;
  systemPrompt?: string;
}

export interface ChatResult {
  success: boolean;
  data?: ChatResponse;
  error?: string;
}

// Helper to convert string role to enum
function toRole(role: 'User' | 'Assistant' | 'System'): Role {
  return Role[role];
}

/**
 * Send a chat message and get a response
 */
export async function chat(input: ChatInput): Promise<ChatResult> {
  try {
    const messages: ChatMessage[] = input.messages.map((m) => ({
      role: toRole(m.role),
      content: m.content,
    }));
    const response = await b.Chat(messages, input.systemPrompt ?? null);
    return { success: true, data: response };
  } catch (error) {
    console.error('[kal-baml] Chat error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Quick single-turn chat
 */
export async function quickChat(
  message: string,
  systemPrompt?: string
): Promise<string> {
  const response = await b.QuickChat(message, systemPrompt ?? null);
  return response;
}

/**
 * Structured chat with sources and follow-ups
 */
export async function structuredChat(
  input: ChatInput & { extractSources?: boolean; suggestFollowups?: boolean }
): Promise<StructuredChatResponse> {
  const messages: ChatMessage[] = input.messages.map((m) => ({
    role: toRole(m.role),
    content: m.content,
  }));
  return await b.StructuredChat(
    messages,
    input.systemPrompt ?? null,
    input.extractSources ?? false,
    input.suggestFollowups ?? false
  );
}

/**
 * Analyze food description for nutrition info
 */
export async function analyzeFood(
  description: string
): Promise<NutritionAnalysis> {
  return await b.AnalyzeFood(description);
}
