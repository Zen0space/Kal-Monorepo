"use client";

import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bell } from "react-feather";

import { pushPromptCheckedAtom, pushPromptVisibleAtom } from "@/atoms/push-prompt";
import {
  pushPermissionAtom,
  pushStateCheckedAtom,
  pushSubscribedAtom,
  pushSupportedAtom,
} from "@/atoms/push-state";
import { useAuth } from "@/lib/auth-context";
import { serializeSubscription, subscribeToPush } from "@/lib/push-notifications";
import {
  recordDismissal,
  recordSubscription,
  shouldShowPrompt,
} from "@/lib/push-prompt-storage";
import { isStandaloneMode } from "@/lib/pwa-install-tracker";
import { trpc } from "@/lib/trpc";

const SHOW_DELAY_MS = 2000;

/**
 * PushPermissionPrompt
 *
 * Bottom-sheet overlay that prompts PWA users to enable push notifications.
 * Reads push capability from shared atoms (set by PushStateProvider).
 *
 * Renders nothing unless ALL conditions are met:
 * - Running in standalone mode (installed PWA)
 * - User is authenticated
 * - Push is supported (requires HTTPS — won't work on HTTP LAN IPs)
 * - Permission is "default" (not granted/denied)
 * - localStorage throttle passes (7-day cooldown, max 3 dismissals)
 * - Not already subscribed
 *
 * Must be rendered inside <AuthProvider> and <TRPCProvider>.
 */
export function PushPermissionPrompt() {
  const { logtoId } = useAuth();
  const [visible, setVisible] = useAtom(pushPromptVisibleAtom);
  const [promptChecked, setPromptChecked] = useAtom(pushPromptCheckedAtom);
  const [animateIn, setAnimateIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Shared push state from PushStateProvider
  const pushStateReady = useAtomValue(pushStateCheckedAtom);
  const supported = useAtomValue(pushSupportedAtom);
  const permission = useAtomValue(pushPermissionAtom);
  const subscribed = useAtomValue(pushSubscribedAtom);
  const setSubscribed = useSetAtom(pushSubscribedAtom);
  const setPermission = useSetAtom(pushPermissionAtom);

  const { data: vapidData } = trpc.push.getVapidPublicKey.useQuery(undefined, {
    enabled: visible,
  });
  const subscribeMutation = trpc.push.subscribe.useMutation();
  const trackEvent = trpc.push.trackPromptEvent.useMutation();

  // ── Condition check: should we show the prompt? ───────────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || promptChecked) return;
    if (!logtoId) return;
    if (!pushStateReady) return;

    // Mark as checked immediately to prevent re-runs
    setPromptChecked(true);

    const standalone = isStandaloneMode();
    const throttleOk = shouldShowPrompt();

    if (!standalone) return;
    if (!supported) return;
    if (permission !== "default") return;
    if (!throttleOk) return;
    if (subscribed) return;

    // All passed — show after delay
    timerRef.current = setTimeout(() => {
      setVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimateIn(true);
        });
      });
    }, SHOW_DELAY_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [logtoId, promptChecked, pushStateReady, supported, permission, subscribed, setVisible, setPromptChecked]);

  // ── Dismiss handler ──────────────────────────────────────────────────────
  const handleDismiss = useCallback(() => {
    setAnimateIn(false);
    setTimeout(() => setVisible(false), 300);

    recordDismissal();
    trackEvent.mutate({ action: "dismissed" });
  }, [setVisible, trackEvent]);

  // ── Enable handler ───────────────────────────────────────────────────────
  const handleEnable = useCallback(async () => {
    if (loading || !vapidData?.vapidPublicKey) return;
    setLoading(true);

    try {
      const subscription = await subscribeToPush(vapidData.vapidPublicKey);

      if (subscription) {
        const serialized = serializeSubscription(subscription);
        await subscribeMutation.mutateAsync({
          endpoint: serialized.endpoint,
          keys: serialized.keys,
          userAgent: navigator.userAgent,
        });

        // Update shared atoms so Settings toggle reflects immediately
        setSubscribed(true);
        setPermission("granted");

        recordSubscription();
        trackEvent.mutate({ action: "subscribed" });
      }

      setAnimateIn(false);
      setTimeout(() => setVisible(false), 300);
    } catch (err) {
      console.warn("[PushPrompt] Failed to subscribe:", err);
      setAnimateIn(false);
      setTimeout(() => setVisible(false), 300);
    } finally {
      setLoading(false);
    }
  }, [loading, vapidData, subscribeMutation, trackEvent, setVisible, setSubscribed, setPermission]);

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          animateIn ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleDismiss}
      />

      {/* Bottom Sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-[9999] transition-transform duration-300 ease-out ${
          animateIn ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="mx-auto max-w-lg">
          <div className="bg-[#141414] border border-white/[0.08] rounded-t-2xl p-6 shadow-[0_-4px_32px_rgba(0,0,0,0.4)]">
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/[0.1] border border-emerald-500/20 flex items-center justify-center">
                <Bell size={24} className="text-emerald-400" />
              </div>
            </div>

            {/* Text */}
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-white mb-1.5">
                Stay Updated
              </h3>
              <p className="text-sm text-white/50 leading-relaxed">
                Get notified about new features, updates, and important
                announcements — even when the app is closed.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleEnable}
                disabled={loading}
                className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-xl text-sm
                  transition-all duration-200 hover:shadow-[0_0_24px_rgba(16,185,129,0.25)]
                  disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2"
              >
                <Bell size={16} />
                {loading ? "Enabling..." : "Enable Notifications"}
              </button>

              <button
                onClick={handleDismiss}
                disabled={loading}
                className="w-full py-3 px-4 text-white/40 hover:text-white/60 font-medium rounded-xl text-sm
                  transition-colors duration-200"
              >
                Not Now
              </button>
            </div>

            {/* Bottom safe area spacer for iOS */}
            <div className="h-[env(safe-area-inset-bottom,0px)]" />
          </div>
        </div>
      </div>
    </>
  );
}
