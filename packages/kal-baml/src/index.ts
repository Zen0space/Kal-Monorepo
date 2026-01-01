// Re-export all BAML generated types and functions
export * from '../baml_client/baml_client/index.js';

// Export convenience wrapper functions
export { chat, quickChat, structuredChat, analyzeFood } from './chat.js';
export type { ChatInput, ChatResult } from './chat.js';
