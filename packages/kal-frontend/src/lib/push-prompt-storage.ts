/**
 * Push Prompt Storage
 *
 * Manages localStorage state for the push notification permission prompt.
 * Controls throttling so we don't nag users:
 * - 7-day cooldown after each dismissal
 * - Max 3 lifetime dismissals, then stop permanently
 * - Track if user subscribed via prompt (never show again)
 */

const STORAGE_KEY = "push-prompt-state";

interface PushPromptState {
  dismissCount: number;
  lastDismissedAt: number | null;
  subscribedViaPrompt: boolean;
}

const DEFAULT_STATE: PushPromptState = {
  dismissCount: 0,
  lastDismissedAt: null,
  subscribedViaPrompt: false,
};

// ─── Constants ──────────────────────────────────────────────────────────────

const MAX_DISMISSALS = 3;
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ─── Read / Write ───────────────────────────────────────────────────────────

function getState(): PushPromptState {
  if (typeof window === "undefined") return DEFAULT_STATE;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATE;
  }
}

function setState(state: PushPromptState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ─── Public API ─────────────────────────────────────────────────────────────

/** Check if the push prompt should be shown (passes all throttle checks) */
export function shouldShowPrompt(): boolean {
  const state = getState();

  // Already subscribed via this prompt — never show again
  if (state.subscribedViaPrompt) return false;

  // Hit lifetime dismissal cap
  if (state.dismissCount >= MAX_DISMISSALS) return false;

  // Within 7-day cooldown
  if (state.lastDismissedAt && Date.now() - state.lastDismissedAt < COOLDOWN_MS) {
    return false;
  }

  return true;
}

/** Record that the user dismissed the prompt */
export function recordDismissal(): void {
  const state = getState();
  setState({
    ...state,
    dismissCount: state.dismissCount + 1,
    lastDismissedAt: Date.now(),
  });
}

/** Record that the user subscribed via the prompt */
export function recordSubscription(): void {
  const state = getState();
  setState({
    ...state,
    subscribedViaPrompt: true,
  });
}
