/**
 * Push Notifications Utility
 *
 * Handles the full lifecycle of PWA push notification subscription:
 * - Check browser support
 * - Request permission
 * - Subscribe via PushManager (using VAPID key)
 * - Send subscription to backend via tRPC
 * - Unsubscribe
 */

// ─── Feature Detection ──────────────────────────────────────────────────────

/** Check if the browser supports push notifications */
export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/** Check if we're on iOS (requires PWA to be installed to Home Screen) */
export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window)
  );
}

/** Check if the PWA is running in standalone mode (installed) */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator &&
      (navigator as unknown as { standalone: boolean }).standalone === true)
  );
}

/** Get the current notification permission state */
// eslint-disable-next-line no-undef
export function getPermissionState(): NotificationPermission | "unsupported" {
  if (!isPushSupported()) return "unsupported";
  return Notification.permission;
}

// ─── VAPID Key ───────────────────────────────────────────────────────────────

/**
 * Convert a base64 URL-encoded VAPID public key to a Uint8Array
 * (required by PushManager.subscribe)
 */
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer as ArrayBuffer;
}

// ─── Subscription Management ─────────────────────────────────────────────────

/** Get the active push subscription (if any) */
export async function getExistingSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;

  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch {
    return null;
  }
}

/** Check if the user is currently subscribed to push notifications */
export async function isSubscribed(): Promise<boolean> {
  const sub = await getExistingSubscription();
  return sub !== null;
}

/**
 * Request notification permission from the user.
 * Returns the resulting permission state.
 */
// eslint-disable-next-line no-undef
export async function requestPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) return "denied";
  return Notification.requestPermission();
}

/**
 * Subscribe to push notifications.
 *
 * Flow:
 * 1. Request notification permission
 * 2. Wait for service worker to be ready
 * 3. Subscribe via PushManager with VAPID public key
 * 4. Return the PushSubscription object (caller sends to backend)
 *
 * @param vapidPublicKey - The VAPID public key from the backend
 * @returns The PushSubscription, or null if the user denied permission
 */
export async function subscribeToPush(
  vapidPublicKey: string
): Promise<PushSubscription | null> {
  if (!isPushSupported()) {
    console.warn("[Push] Push notifications not supported in this browser");
    return null;
  }

  // iOS check: must be installed as PWA
  if (isIOS() && !isStandalone()) {
    console.warn(
      "[Push] On iOS, push notifications require the PWA to be installed to the Home Screen"
    );
    return null;
  }

  // Request permission
  const permission = await requestPermission();
  if (permission !== "granted") {
    console.info("[Push] Permission not granted:", permission);
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    // Check if already subscribed
    const existingSub = await registration.pushManager.getSubscription();
    if (existingSub) {
      console.info(
        "[Push] Already subscribed, returning existing subscription"
      );
      return existingSub;
    }

    // Subscribe with VAPID key
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    console.info("[Push] Successfully subscribed");
    return subscription;
  } catch (error) {
    console.error("[Push] Failed to subscribe:", error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications.
 * Returns the endpoint that was unsubscribed (for backend cleanup).
 */
export async function unsubscribeFromPush(): Promise<string | null> {
  try {
    const subscription = await getExistingSubscription();
    if (!subscription) return null;

    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();
    console.info("[Push] Successfully unsubscribed");
    return endpoint;
  } catch (error) {
    console.error("[Push] Failed to unsubscribe:", error);
    return null;
  }
}

/**
 * Extract the subscription data in the format the backend expects.
 */
export function serializeSubscription(sub: PushSubscription): {
  endpoint: string;
  keys: { p256dh: string; auth: string };
} {
  const json = sub.toJSON();
  return {
    endpoint: sub.endpoint,
    keys: {
      p256dh: json.keys?.p256dh || "",
      auth: json.keys?.auth || "",
    },
  };
}
