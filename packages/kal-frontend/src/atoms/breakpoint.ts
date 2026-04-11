import { atom } from "jotai";

// ---------------------------------------------------------------------------
// Breakpoint Definitions
// ---------------------------------------------------------------------------

export type Breakpoint = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
export type ScreenCategory = "mobile" | "tablet" | "desktop" | "wide" | "ultrawide";

export const BREAKPOINTS: Record<Breakpoint, number> = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
  "3xl": 1920,
  "4xl": 2560,
};

// ---------------------------------------------------------------------------
// Primitive Atoms (written by BreakpointProvider)
// ---------------------------------------------------------------------------

/** Current window.innerWidth — default 1024 for SSR-safe desktop fallback */
export const windowWidthAtom = atom(1024);

/** Whether the client has mounted (hydrated) */
export const breakpointMountedAtom = atom(false);

// ---------------------------------------------------------------------------
// Derived: Breakpoint Info (read-only)
// ---------------------------------------------------------------------------

function getBreakpoint(width: number): Breakpoint | "xs" {
  if (width >= BREAKPOINTS["4xl"]) return "4xl";
  if (width >= BREAKPOINTS["3xl"]) return "3xl";
  if (width >= BREAKPOINTS["2xl"]) return "2xl";
  if (width >= BREAKPOINTS.xl) return "xl";
  if (width >= BREAKPOINTS.lg) return "lg";
  if (width >= BREAKPOINTS.md) return "md";
  if (width >= BREAKPOINTS.sm) return "sm";
  return "xs";
}

function getScreenCategory(width: number): ScreenCategory {
  if (width >= BREAKPOINTS["4xl"]) return "ultrawide";
  if (width >= BREAKPOINTS["3xl"]) return "wide";
  if (width >= BREAKPOINTS.lg) return "desktop";
  if (width >= BREAKPOINTS.md) return "tablet";
  return "mobile";
}

/** Full breakpoint state — same shape as the old useBreakpoint() return */
export const breakpointAtom = atom((get) => {
  const width = get(windowWidthAtom);
  const isMounted = get(breakpointMountedAtom);

  return {
    breakpoint: getBreakpoint(width),
    isMobile: isMounted && width < BREAKPOINTS.md,
    isTablet: isMounted && width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
    isDesktop: !isMounted || width >= BREAKPOINTS.lg, // Default to desktop for SSR
    isWideScreen: isMounted && width >= BREAKPOINTS["3xl"],
    isUltraWide: isMounted && width >= BREAKPOINTS["4xl"],
    screenCategory: isMounted ? getScreenCategory(width) : ("desktop" as ScreenCategory),
    width,
    isMounted,
  };
});

// ---------------------------------------------------------------------------
// Derived: Sidebar Layout (read-only)
// ---------------------------------------------------------------------------

/** Sidebar-specific layout state — same shape as the old useSidebarLayout() return */
export const sidebarLayoutAtom = atom((get) => {
  const { isMobile, isTablet, isMounted } = get(breakpointAtom);

  return {
    isMobile,
    shouldAutoCollapse: isMounted && (isMobile || isTablet),
    defaultCollapsed: isTablet,
    isMounted,
  };
});
