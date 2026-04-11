"use client";

import { useAtom } from "jotai";
import { useCallback, useEffect, useRef } from "react";

import { pwaInstallTrackedAtom, pwaTrackedUserIdAtom } from "@/atoms/pwa";
import { useAuth } from "@/lib/auth-context";
import {
  detectBrowser,
  detectPlatform,
  generateFingerprint,
  getDisplayMode,
  getScreenResolution,
  isStandaloneMode,
  PWA_INSTALL_TRACKED_KEY,
} from "@/lib/pwa-install-tracker";
import { trpc } from "@/lib/trpc";

/**
 * PwaInstallTracker
 *
 * Invisible component that detects PWA installs and reports them to the backend.
 * Must be rendered inside <TRPCProvider> and <AuthProvider>.
 *
 * Detection strategies:
 * 1. On mount: check if running in standalone mode (covers iOS + Chromium)
 * 2. Listen for `appinstalled` event (Chromium browsers fire this at install time)
 * 3. On auth change: re-track to claim anonymous installs for the logged-in user
 *
 * Uses a jotai atom to track the userId used for the last call, so when auth
 * transitions from null → userId we re-call trackInstall (the backend upserts
 * by fingerprint and updates the userId).
 *
 * localStorage is used only to persist across page reloads — it stores the
 * userId that was last tracked so we know whether a re-track is needed.
 */
export function PwaInstallTracker() {
  const trackInstall = trpc.pwa.trackInstall.useMutation();
  const { logtoId } = useAuth();
  const [installTracked, setInstallTracked] = useAtom(pwaInstallTrackedAtom);
  const [trackedUserId, setTrackedUserId] = useAtom(pwaTrackedUserIdAtom);
  const isTracking = useRef(false);

  const track = useCallback(async () => {
    if (typeof window === "undefined" || isTracking.current) return;

    isTracking.current = true;

    try {
      const ua = navigator.userAgent;
      const fingerprint = await generateFingerprint();

      await trackInstall.mutateAsync({
        platform: detectPlatform(ua),
        browser: detectBrowser(ua),
        userAgent: ua.slice(0, 500),
        screenResolution: getScreenResolution(),
        displayMode: getDisplayMode(),
        fingerprint,
      });

      // Persist: store which userId we tracked with
      localStorage.setItem(
        PWA_INSTALL_TRACKED_KEY,
        JSON.stringify({ userId: logtoId ?? null })
      );

      setInstallTracked(true);
      setTrackedUserId(logtoId ?? null);
    } catch (err) {
      console.warn("[PWA Install Tracker] Failed to track install:", err);
    } finally {
      isTracking.current = false;
    }
  }, [trackInstall, logtoId, setInstallTracked, setTrackedUserId]);

  // ── Strategy 1 & 2: Initial detect + appinstalled event ─────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Hydrate atom state from localStorage on first mount
    const stored = localStorage.getItem(PWA_INSTALL_TRACKED_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { userId: string | null };
        setInstallTracked(true);
        setTrackedUserId(parsed.userId);
      } catch {
        // Legacy format ("true") — treat as anonymous tracked
        setInstallTracked(true);
        setTrackedUserId(null);
      }
    }

    // Detect standalone mode on mount
    if (isStandaloneMode() && !stored) {
      track();
    }

    // Listen for Chromium appinstalled event
    const handleAppInstalled = () => {
      track();
    };
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
    // Only run on mount for initial detection + event listener setup
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Strategy 3: Claim anonymous install when user logs in ───────────────
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Only re-track if:
    // 1. We have an authenticated user now
    // 2. The install was previously tracked as anonymous (trackedUserId is null)
    // 3. We're in standalone mode (it's a real PWA install)
    if (
      logtoId &&
      installTracked &&
      trackedUserId === null &&
      isStandaloneMode()
    ) {
      track();
    }
  }, [logtoId, installTracked, trackedUserId, track]);

  return null;
}
