import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

// eslint-disable-next-line no-undef
declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  // Precache entries injected by @serwist/next at build time
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: false,
  // No runtime caching — app requires internet
  runtimeCaching: [],
});

serwist.addEventListeners();

// ─── Push Notification Handlers ──────────────────────────────────────────────

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data: {
    title?: string;
    body?: string;
    url?: string;
    icon?: string;
    badge?: string;
    tag?: string;
  };

  try {
    data = event.data.json();
  } catch {
    data = { title: "Kalori", body: event.data.text() };
  }

  const title = data.title || "Kalori";
  // eslint-disable-next-line no-undef
  const options: NotificationOptions & { vibrate?: number[] } = {
    body: data.body || "",
    icon: data.icon || "/assets/icon-logo-192x192.png",
    badge: data.badge || "/assets/icon-logo-192x192.png",
    tag: data.tag || "kalori-notification",
    data: {
      url: data.url || "/dashboard",
    },
    // Vibrate pattern for mobile: vibrate 200ms, pause 100ms, vibrate 200ms
    vibrate: [200, 100, 200],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl =
    (event.notification.data as { url?: string })?.url || "/dashboard";

  // Focus an existing window if possible, otherwise open a new one
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Try to find an existing window/tab and focus it
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.focus();
            client.navigate(targetUrl);
            return;
          }
        }
        // No existing window, open a new one
        return self.clients.openWindow(targetUrl);
      })
  );
});
