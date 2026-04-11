"use client";

import { useAtomValue } from "jotai";
import { useState, useEffect } from "react";

import { breakpointAtom, sidebarLayoutAtom } from "@/atoms/breakpoint";

/**
 * Hook to detect if the viewport matches a media query.
 * Standalone — does NOT use the breakpoint atoms (different concern).
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
 * Hook to detect current breakpoint.
 *
 * Reads from shared jotai atoms (set by BreakpointProvider in layout.tsx).
 * No local useState or useEffect — all consumers share a single resize listener.
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
export function useBreakpoint() {
  return useAtomValue(breakpointAtom);
}

/**
 * Hook specifically for sidebar/layout behavior.
 * Reads from shared jotai atoms.
 */
export function useSidebarLayout() {
  return useAtomValue(sidebarLayoutAtom);
}
