"use client";

import { useAtom } from "jotai";
import { useCallback } from "react";
import { MessageCircle, X } from "react-feather";

import { ChatActivityBar } from "./ChatActivityBar";
import { ChatPanel } from "./ChatPanel";

import { chatPanelOpenAtom } from "@/atoms/chat";
import { useAuth } from "@/lib/auth-context";

/**
 * Chat widget — orchestrates the right-side panel layout.
 *
 * The ChatPanel is **always mounted** (never unmounted on close). Open/close
 * is purely CSS-driven (width transition on desktop, translate on mobile).
 * This preserves scroll position, input text, query cache, and streaming
 * state across open/close cycles — and eliminates the "scroll to bottom"
 * animation that used to play on every panel open.
 *
 * Desktop (sm+): Activity bar (always visible) + push panel (width transition).
 * Mobile (<sm): FAB + fullscreen overlay (translate-y transition).
 */
export function ChatWidget() {
  const { logtoId } = useAuth();
  const [isOpen, setIsOpen] = useAtom(chatPanelOpenAtom);

  const toggle = useCallback(() => setIsOpen((prev) => !prev), [setIsOpen]);
  const close = useCallback(() => setIsOpen(false), [setIsOpen]);

  // Only show for authenticated users
  if (!logtoId) return null;

  return (
    <>
      {/* ── Desktop: Activity bar (always visible) ── */}
      <ChatActivityBar />

      {/* ── Mobile backdrop ── */}
      <div
        className={[
          "fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] sm:hidden",
          "transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        ].join(" ")}
        onClick={close}
      />

      {/* ── Chat panel — always mounted, CSS-driven show/hide ── */}
      <div
        aria-hidden={!isOpen}
        className={[
          "flex flex-col bg-dark-surface",
          // Mobile: fullscreen fixed overlay that slides up from bottom
          "max-sm:fixed max-sm:inset-0 max-sm:z-[61]",
          "max-sm:transition-transform max-sm:duration-300 max-sm:ease-out",
          isOpen
            ? "max-sm:translate-y-0"
            : "max-sm:translate-y-full max-sm:pointer-events-none",
          // Desktop: push panel in flex row with width transition
          "sm:shrink-0 sm:h-full sm:overflow-hidden",
          "sm:border-l sm:border-dark-border",
          "sm:transition-[width,opacity] sm:duration-300 sm:ease-out",
          isOpen
            ? "sm:w-[400px] lg:w-[500px] sm:opacity-100"
            : "sm:w-0 sm:opacity-0 sm:pointer-events-none",
        ].join(" ")}
      >
        {/* Inner wrapper preserves content width during desktop width transition */}
        <div className="h-full flex flex-col sm:min-w-[400px] lg:min-w-[500px]">
          <ChatPanel onClose={close} />
        </div>
      </div>

      {/* ── Mobile FAB ── */}
      <button
        onClick={toggle}
        className={[
          "fixed bottom-6 right-6 z-[62]",
          "w-14 h-14 rounded-full",
          "flex items-center justify-center",
          "shadow-lg shadow-black/30",
          "transition-all duration-200",
          "sm:hidden",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-dark",
          isOpen
            ? "bg-dark-elevated border border-dark-border text-content-secondary hover:text-content-primary"
            : "bg-accent text-dark hover:bg-accent-hover hover:scale-105 active:scale-95",
        ].join(" ")}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </>
  );
}
