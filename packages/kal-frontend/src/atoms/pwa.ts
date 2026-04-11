import { atom } from "jotai";

import { breakpointMountedAtom } from "@/atoms/breakpoint";
import { isStandaloneMode } from "@/lib/pwa-install-tracker";

// ---------------------------------------------------------------------------
// Standalone Mode Detection (derived from BreakpointProvider hydration)
// ---------------------------------------------------------------------------

/**
 * Whether the app is running in PWA standalone mode.
 *
 * - `null` before client hydration (breakpointMountedAtom is false)
 * - `true` / `false` after hydration
 *
 * Reads breakpointMountedAtom so it waits for the BreakpointProvider
 * to signal that the client has mounted before calling isStandaloneMode().
 */
export const pwaStandaloneAtom = atom<boolean | null>((get) => {
  const mounted = get(breakpointMountedAtom);
  if (!mounted) return null; // SSR / pre-hydration
  return isStandaloneMode();
});

// ---------------------------------------------------------------------------
// PWA Install Tracking State
// ---------------------------------------------------------------------------

/**
 * Whether the PWA install has been tracked in this session.
 * Separate from localStorage — this prevents duplicate calls within a single
 * React lifecycle while allowing re-tracking when auth state changes.
 */
export const pwaInstallTrackedAtom = atom(false);

/**
 * The userId that was used for the last track call.
 * null = tracked as anonymous, undefined = never tracked.
 * When auth changes from null → string, we know to re-track.
 */
export const pwaTrackedUserIdAtom = atom<string | null | undefined>(undefined);
