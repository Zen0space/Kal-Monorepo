"use client";

import { useSetAtom } from "jotai";
import { useCallback, useRef } from "react";

import { scrolledAtom } from "@/atoms/scroll";

export function ScrollProvider({ children }: { children: React.ReactNode }) {
  const setScrolled = useSetAtom(scrolledAtom);
  const lastScrolled = useRef(false);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const isScrolled = e.currentTarget.scrollTop > 20;
      if (isScrolled !== lastScrolled.current) {
        lastScrolled.current = isScrolled;
        setScrolled(isScrolled);
      }
    },
    [setScrolled]
  );

  return (
    <div className="flex-1 min-w-0 overflow-y-auto" onScroll={handleScroll}>
      {children}
    </div>
  );
}
