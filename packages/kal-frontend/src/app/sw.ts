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
