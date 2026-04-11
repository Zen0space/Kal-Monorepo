import { atom } from "jotai";

import {
  pushPermissionAtom,
  pushStateCheckedAtom,
  pushSubscribedAtom,
  pushSupportedAtom,
} from "@/atoms/push-state";
import { pwaStandaloneAtom } from "@/atoms/pwa";
import { shouldShowPrompt } from "@/lib/push-prompt-storage";

// ---------------------------------------------------------------------------
// Push Permission Prompt State
// ---------------------------------------------------------------------------

/** Whether the push permission bottom sheet is visible */
export const pushPromptVisibleAtom = atom(false);

/**
 * Derived: whether the user is eligible to see the push prompt.
 *
 * Pure reactive computation — re-evaluates whenever any source atom changes.
 * No one-shot gate, so it survives route changes (e.g. / → /dashboard redirect).
 *
 * Conditions:
 * 1. PushStateProvider has finished checking capabilities
 * 2. Running in PWA standalone mode
 * 3. Push API is supported (requires HTTPS)
 * 4. Permission is "default" (not already granted/denied)
 * 5. Not already subscribed
 * 6. localStorage throttle passes (7-day cooldown, max 3 dismissals)
 */
export const pushPromptEligibleAtom = atom((get) => {
  if (!get(pushStateCheckedAtom)) return false;
  if (get(pwaStandaloneAtom) !== true) return false;
  if (!get(pushSupportedAtom)) return false;
  if (get(pushPermissionAtom) !== "default") return false;
  if (get(pushSubscribedAtom)) return false;
  return shouldShowPrompt();
});
