"use client";

import { useState, useEffect } from "react";

type Breakpoint = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
type ScreenCategory = "mobile" | "tablet" | "desktop" | "wide" | "ultrawide";

const breakpoints: Record<Breakpoint, number> = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
  "3xl": 1920,  // Full HD / 2K with scaling
  "4xl": 2560,  // 2K native / 4K with scaling
};

/**
 * Hook to detect if the viewport matches a media query
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    
    // Set initial value
    setMatches(media.matches);

    // Listen for changes
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener("change", listener);

    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
}

/**
 * Hook to detect current breakpoint
 * Returns default desktop values on server, updates on client after mount
 * 
 * Breakpoints:
 * - xs: < 640px (mobile portrait)
 * - sm: 640px+ (mobile landscape)
 * - md: 768px+ (tablet portrait)
 * - lg: 1024px+ (tablet landscape / small laptop)
 * - xl: 1280px+ (laptop / 1080p)
 * - 2xl: 1536px+ (large laptop)
 * - 3xl: 1920px+ (1080p full / 2K scaled)
 * - 4xl: 2560px+ (2K native / 4K scaled)
 */
export function useBreakpoint(): {
  breakpoint: Breakpoint | "xs";
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isWideScreen: boolean;   // 1920px+ (3xl)
  isUltraWide: boolean;    // 2560px+ (4xl)
  screenCategory: ScreenCategory;
  width: number;
  isMounted: boolean;
} {
  const [isMounted, setIsMounted] = useState(false);
  const [width, setWidth] = useState(1024); // Default to desktop width for SSR

  useEffect(() => {
    // Mark as mounted first
    setIsMounted(true);
    
    // Set actual width
    setWidth(window.innerWidth);

    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getBreakpoint = (): Breakpoint | "xs" => {
    if (width >= breakpoints["4xl"]) return "4xl";
    if (width >= breakpoints["3xl"]) return "3xl";
    if (width >= breakpoints["2xl"]) return "2xl";
    if (width >= breakpoints.xl) return "xl";
    if (width >= breakpoints.lg) return "lg";
    if (width >= breakpoints.md) return "md";
    if (width >= breakpoints.sm) return "sm";
    return "xs";
  };

  const getScreenCategory = (): ScreenCategory => {
    if (width >= breakpoints["4xl"]) return "ultrawide";
    if (width >= breakpoints["3xl"]) return "wide";
    if (width >= breakpoints.lg) return "desktop";
    if (width >= breakpoints.md) return "tablet";
    return "mobile";
  };

  const breakpoint = getBreakpoint();

  return {
    breakpoint,
    isMobile: isMounted && width < breakpoints.md,
    isTablet: isMounted && width >= breakpoints.md && width < breakpoints.lg,
    isDesktop: !isMounted || width >= breakpoints.lg, // Default to desktop for SSR
    isWideScreen: isMounted && width >= breakpoints["3xl"],
    isUltraWide: isMounted && width >= breakpoints["4xl"],
    screenCategory: isMounted ? getScreenCategory() : "desktop",
    width,
    isMounted,
  };
}

/**
 * Hook specifically for sidebar/layout behavior
 */
export function useSidebarLayout(): {
  isMobile: boolean;
  shouldAutoCollapse: boolean;
  defaultCollapsed: boolean;
  isMounted: boolean;
} {
  const { isMobile, isTablet, isMounted } = useBreakpoint();

  return {
    isMobile,
    shouldAutoCollapse: isMounted && (isMobile || isTablet),
    defaultCollapsed: isTablet,
    isMounted,
  };
}
