"use client";

import { useSetAtom } from "jotai";
import { useEffect } from "react";

import { breakpointMountedAtom, windowWidthAtom } from "@/atoms/breakpoint";

/**
 * BreakpointProvider
 *
 * Invisible component that sets up a single global resize listener
 * and writes the current window width to jotai atoms.
 *
 * Render once in layout.tsx — all consumers read from shared atoms
 * via useBreakpoint() / useSidebarLayout(), eliminating duplicate listeners.
 */
export function BreakpointProvider() {
  const setWidth = useSetAtom(windowWidthAtom);
  const setMounted = useSetAtom(breakpointMountedAtom);

  useEffect(() => {
    setMounted(true);
    setWidth(window.innerWidth);

    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, [setWidth, setMounted]);

  return null;
}
