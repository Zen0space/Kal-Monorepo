/**
 * PWA Install Tracking Utilities
 *
 * Detects standalone/installed mode, identifies platform and browser,
 * and generates a device fingerprint for deduplication.
 */

// ─── Platform Detection ──────────────────────────────────────────────────────

export function detectPlatform(
  ua: string
): "ios" | "android" | "desktop" | "unknown" {
  const lower = ua.toLowerCase();

  if (/iphone|ipad|ipod/.test(lower)) return "ios";
  if (/android/.test(lower)) return "android";
  if (/windows|macintosh|mac os|linux/.test(lower)) return "desktop";

  return "unknown";
}

// ─── Browser Detection ───────────────────────────────────────────────────────

export function detectBrowser(ua: string): string {
  const lower = ua.toLowerCase();

  // Order matters — more specific checks first
  if (/samsungbrowser/.test(lower)) return "samsung";
  if (/edg(e|a|ios)?\//.test(lower)) return "edge";
  if (/opr\/|opera/.test(lower)) return "opera";
  if (/firefox|fxios/.test(lower)) return "firefox";
  if (/crios/.test(lower)) return "chrome"; // Chrome on iOS
  if (/chrome|chromium/.test(lower)) return "chrome";
  if (/safari/.test(lower)) return "safari";

  return "unknown";
}

// ─── Standalone Mode Detection ───────────────────────────────────────────────

export function isStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;

  // iOS Safari: navigator.standalone
  if (
    "standalone" in navigator &&
    (navigator as { standalone?: boolean }).standalone === true
  ) {
    return true;
  }

  // Chromium-based: display-mode media query
  if (window.matchMedia("(display-mode: standalone)").matches) {
    return true;
  }

  // Also check fullscreen and minimal-ui (other PWA display modes)
  if (window.matchMedia("(display-mode: fullscreen)").matches) {
    return true;
  }

  if (window.matchMedia("(display-mode: minimal-ui)").matches) {
    return true;
  }

  return false;
}

// ─── Display Mode Detection ──────────────────────────────────────────────────

export function getDisplayMode(): string {
  if (typeof window === "undefined") return "unknown";

  if (
    "standalone" in navigator &&
    (navigator as { standalone?: boolean }).standalone === true
  ) {
    return "standalone"; // iOS
  }

  if (window.matchMedia("(display-mode: fullscreen)").matches)
    return "fullscreen";
  if (window.matchMedia("(display-mode: standalone)").matches)
    return "standalone";
  if (window.matchMedia("(display-mode: minimal-ui)").matches)
    return "minimal-ui";

  return "browser";
}

// ─── Screen Resolution ───────────────────────────────────────────────────────

export function getScreenResolution(): string {
  if (typeof window === "undefined") return "unknown";
  return `${window.screen.width}x${window.screen.height}`;
}

// ─── Fingerprint Generation ──────────────────────────────────────────────────

/**
 * Generate a simple device fingerprint for deduplication.
 * Uses a hash of user agent + screen dimensions + platform + pixel ratio.
 * Not meant to be cryptographically secure — just unique enough
 * to prevent the same device from being counted twice.
 */
export async function generateFingerprint(): Promise<string> {
  const parts = [
    navigator.userAgent,
    `${window.screen.width}x${window.screen.height}`,
    `${window.devicePixelRatio}`,
    detectPlatform(navigator.userAgent),
    navigator.language,
  ].join("|");

  // Use SubtleCrypto for hashing (available in secure contexts / localhost)
  if (crypto?.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(parts);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  // Fallback: simple string hash
  let hash = 0;
  for (let i = 0; i < parts.length; i++) {
    const char = parts.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return `fallback-${Math.abs(hash).toString(36)}`;
}

// ─── LocalStorage Key ────────────────────────────────────────────────────────

export const PWA_INSTALL_TRACKED_KEY = "pwa-install-tracked";
