/**
 * useTypography — Semantic typography class names
 *
 * Provides consistent, reusable Tailwind class strings for every text role
 * in the app. Font stack:
 *   - JetBrains Mono (font-mono) — base body font for everything
 *   - Space Grotesk  (font-display) — accent font for titles & highlights
 *
 * Usage:
 *   const t = useTypography();
 *   <h1 className={t.display}>Page Title</h1>
 *   <p className={t.body}>Regular text</p>
 *
 * Or import the static object directly (no hook needed when you don't need
 * reactive behavior):
 *   import { typography } from "@/hooks/useTypography";
 */

/** Semantic text styles — each value is a Tailwind class string. */
export const typography = {
  /** Page titles — Space Grotesk, 2xl→3xl, bold, tight tracking */
  display:
    "font-display text-2xl md:text-3xl font-bold tracking-tight leading-tight",

  /** Section headings — Space Grotesk, xl→2xl, semibold */
  heading:
    "font-display text-xl md:text-2xl font-semibold tracking-tight leading-snug",

  /** Card / sub-section titles — Space Grotesk, lg, medium */
  subheading: "font-display text-base md:text-lg font-semibold leading-snug",

  /** Body text — JetBrains Mono, sm→base, normal weight */
  body: "font-mono text-sm md:text-base font-normal leading-relaxed",

  /** Small body / descriptions — JetBrains Mono, xs→sm */
  bodySmall: "font-mono text-xs md:text-sm font-normal leading-relaxed",

  /** Inline / block code — JetBrains Mono, xs→sm */
  code: "font-mono text-xs md:text-sm leading-relaxed",

  /** Captions, timestamps, helper text — JetBrains Mono, xs */
  caption: "font-mono text-xs font-normal leading-normal",

  /** Labels, badges, table headers — JetBrains Mono, xs, uppercase */
  label:
    "font-mono text-xs font-semibold uppercase tracking-wider leading-normal",

  /** Highlighted / accent words — Space Grotesk, inherits size, semibold */
  highlight: "font-display font-semibold",
} as const;

export type TypographyKey = keyof typeof typography;

/**
 * Hook wrapper — returns the same static typography object.
 * Use this in components for consistency with the hook pattern.
 */
export function useTypography() {
  return typography;
}
