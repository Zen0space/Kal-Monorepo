"use client";

import { useState, useEffect } from "react";

type Breakpoint = "sm" | "md" | "lg" | "xl" | "2xl";

const breakpoints: Record<Breakpoint, number> = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
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
 */
export function useBreakpoint(): {
  breakpoint: Breakpoint | "xs";
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
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
    if (width >= breakpoints["2xl"]) return "2xl";
    if (width >= breakpoints.xl) return "xl";
    if (width >= breakpoints.lg) return "lg";
    if (width >= breakpoints.md) return "md";
    if (width >= breakpoints.sm) return "sm";
    return "xs";
  };

  const breakpoint = getBreakpoint();

  return {
    breakpoint,
    isMobile: isMounted && width < breakpoints.md,
    isTablet: isMounted && width >= breakpoints.md && width < breakpoints.lg,
    isDesktop: !isMounted || width >= breakpoints.lg, // Default to desktop for SSR
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
