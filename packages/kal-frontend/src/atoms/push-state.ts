import { atom } from "jotai";

// ---------------------------------------------------------------------------
// Push Notification State (shared between PushPermissionPrompt + Settings)
// ---------------------------------------------------------------------------

/** Whether the browser supports push notifications (PushManager + Notification APIs) */
export const pushSupportedAtom = atom(false);

/** Current notification permission state */
export const pushPermissionAtom = atom<NotificationPermission | "unsupported">("default");

/** Whether the user is currently subscribed to push notifications */
export const pushSubscribedAtom = atom(false);

/** iOS-specific: PWA not installed to home screen (push won't work) */
export const pushIosNotInstalledAtom = atom(false);

/** Whether the initial async capability check has completed */
export const pushStateCheckedAtom = atom(false);
