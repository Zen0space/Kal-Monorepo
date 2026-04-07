/**
 * Site configuration derived from environment variables.
 *
 * All domain references in the app should use these helpers
 * so nothing is hardcoded and forks can configure via .env.
 */

/** Site URL, e.g. http://localhost:3000 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

/** Site domain for display, e.g. localhost:3000 */
export const SITE_DOMAIN =
  process.env.NEXT_PUBLIC_SITE_DOMAIN || "localhost:3000";

/** API base URL, e.g. http://localhost:4000 */
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

/** API domain for display in docs/examples, e.g. localhost:4000 */
export const API_DOMAIN =
  process.env.NEXT_PUBLIC_API_DOMAIN || "localhost:4000";

/** API base URL with https for code examples shown to users */
export const API_URL_DISPLAY =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

/** Support email address */
export const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@localhost";

/** Privacy email address */
export const PRIVACY_EMAIL =
  process.env.NEXT_PUBLIC_PRIVACY_EMAIL || "privacy@localhost";
