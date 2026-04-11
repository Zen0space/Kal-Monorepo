"use client";

import { useAtomValue } from "jotai";
import { useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

import { pwaStandaloneAtom } from "@/atoms/pwa";

/**
 * PwaAuthRedirect
 *
 * Works with the server-rendered splash in page.tsx for a seamless cold start.
 *
 * page.tsx (server) renders the breathing icon at z-40 — visible from first paint.
 * This client component renders at z-50 — sits on top after hydration:
 *
 *   - standalone === null  → still hydrating, render nothing (server splash shows through)
 *   - standalone === true  → PWA: render nothing (server splash shows), fire redirect
 *   - standalone === false → desktop: render fallback (covers server splash)
 *   - !isAuthenticated     → render fallback immediately
 *
 * State is derived entirely from jotai atoms — no useState needed.
 * The only useEffect handles the imperative router.replace() call.
 */
export function PwaAuthRedirect({
  isAuthenticated,
  fallback,
}: {
  isAuthenticated: boolean;
  fallback?: ReactNode;
}) {
  const router = useRouter();
  const standalone = useAtomValue(pwaStandaloneAtom);
  const redirected = useRef(false);

  // Imperative redirect — can't be done in render, needs useEffect
  useEffect(() => {
    if (!isAuthenticated) return;
    if (standalone !== true) return;
    if (redirected.current) return;

    redirected.current = true;
    router.replace("/dashboard");
  }, [isAuthenticated, standalone, router]);

  // Unauthenticated: show fallback (covers server splash with z-50)
  if (!isAuthenticated) {
    return <div className="relative z-50">{fallback}</div>;
  }

  // Hydrating (standalone === null): render nothing — server splash at z-40 shows through
  if (standalone === null) return null;

  // PWA standalone: render nothing — server splash stays visible while redirect fires
  if (standalone === true) return null;

  // Desktop/browser: show the landing page (covers server splash with z-50)
  return <div className="relative z-50">{fallback}</div>;
}
