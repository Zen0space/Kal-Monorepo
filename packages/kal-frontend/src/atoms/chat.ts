import { atom } from "jotai";

import type { ToolStep } from "@/components/chat/ToolStepIndicator";

// ---------------------------------------------------------------------------
// Chat message type (local to frontend)
// ---------------------------------------------------------------------------

export interface ChatMessageLocal {
  _id: string;
  role: "User" | "Assistant";
  content: string;
  createdAt: Date;
  streaming?: boolean;
}

// ---------------------------------------------------------------------------
// Panel UI state
// ---------------------------------------------------------------------------

/** Whether the chat panel is open (used by ChatWidget, ChatActivityBar, etc.) */
export const chatPanelOpenAtom = atom(false);

// ---------------------------------------------------------------------------
// Thread state
// ---------------------------------------------------------------------------

/** Currently selected thread id */
export const activeThreadIdAtom = atom<string | null>(null);

/** Whether the thread list sidebar is visible */
export const showThreadListAtom = atom(false);

// ---------------------------------------------------------------------------
// Message / streaming state
// ---------------------------------------------------------------------------

/** Optimistic user message(s) shown before server confirms */
export const optimisticMessagesAtom = atom<ChatMessageLocal[]>([]);

/** Accumulated streamed assistant text */
export const streamingContentAtom = atom("");

/** Tool workflow steps currently displayed */
export const toolStepsAtom = atom<ToolStep[]>([]);

/** Whether a send/stream operation is in progress */
export const isSendingAtom = atom(false);

/** Current input text in the message box */
export const inputAtom = atom("");

// ---------------------------------------------------------------------------
// Write-only action atoms
// ---------------------------------------------------------------------------

/** Reset all streaming/send-related state in one shot */
export const resetStreamStateAtom = atom(null, (_get, set) => {
  set(optimisticMessagesAtom, []);
  set(streamingContentAtom, "");
  set(toolStepsAtom, []);
  set(isSendingAtom, false);
});
