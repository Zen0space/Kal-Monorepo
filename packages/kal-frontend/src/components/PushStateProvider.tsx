"use client";

import { useSetAtom } from "jotai";
import { useEffect } from "react";

import {
  pushIosNotInstalledAtom,
  pushPermissionAtom,
  pushStateCheckedAtom,
  pushSubscribedAtom,
  pushSupportedAtom,
} from "@/atoms/push-state";
import {
  getPermissionState,
  isIOS,
  isPushSupported,
  isStandalone,
  isSubscribed,
} from "@/lib/push-notifications";

/**
 * PushStateProvider
 *
 * Invisible component that runs push notification capability checks once
 * on mount and writes results to shared jotai atoms.
 *
 * Both PushPermissionPrompt and Settings PushNotificationCard read
 * from these atoms instead of running their own duplicate checks.
 *
 * Render once in layout.tsx.
 */
export function PushStateProvider() {
  const setSupported = useSetAtom(pushSupportedAtom);
  const setPermission = useSetAtom(pushPermissionAtom);
  const setSubscribed = useSetAtom(pushSubscribedAtom);
  const setIosNotInstalled = useSetAtom(pushIosNotInstalledAtom);
  const setChecked = useSetAtom(pushStateCheckedAtom);

  useEffect(() => {
    const check = async () => {
      const supported = isPushSupported();
      setSupported(supported);
      setPermission(getPermissionState());
      setIosNotInstalled(isIOS() && !isStandalone());

      if (supported) {
        const sub = await isSubscribed();
        setSubscribed(sub);
      }

      setChecked(true);
    };

    check();
  }, [setSupported, setPermission, setSubscribed, setIosNotInstalled, setChecked]);

  return null;
}
