import { atom } from "jotai";

// ---------------------------------------------------------------------------
// Push Permission Prompt State
// ---------------------------------------------------------------------------

/** Whether the push permission bottom sheet is visible */
export const pushPromptVisibleAtom = atom(false);

/** Whether we've already evaluated prompt conditions this session */
export const pushPromptCheckedAtom = atom(false);
