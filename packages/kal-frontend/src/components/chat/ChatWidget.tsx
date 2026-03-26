"use client";

import { MessageCircle, X } from "react-feather";

import { ChatActivityBar } from "./ChatActivityBar";
import { ChatPanel } from "./ChatPanel";

import { useChatPanel } from "@/contexts/ChatPanelContext";
import { useAuth } from "@/lib/auth-context";

/**
 * Chat widget — orchestrates the right-side panel layout.
 *
 * Desktop (sm+): Activity bar (always visible) + push panel that takes space in the flex row.
 * Mobile (<sm): Floating action button + fullscreen overlay.
 *
 * Rendered at the root layout level, auth-gated internally.
 */
export function ChatWidget() {
  const { logtoId } = useAuth();
  const { isOpen, toggle, close } = useChatPanel();

  // Only show for authenticated users
  if (!logtoId) return null;

  return (
    <>
      {/* ── Desktop: Activity bar + push panel ── */}
      <ChatActivityBar />

      {isOpen && (
        <div
          className={[
            // Desktop: inline push panel (part of flex row)
            "hidden sm:flex flex-col shrink-0",
            "w-[400px] lg:w-[500px]",
            "h-full",
            "bg-dark-surface border-l border-dark-border",
            "animate-panel-slide-in",
          ].join(" ")}
        >
          <ChatPanel onClose={close} />
        </div>
      )}

      {/* ── Mobile: FAB + fullscreen overlay ── */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] sm:hidden"
            onClick={close}
          />
          {/* Fullscreen panel */}
          <div className="fixed inset-0 z-[61] sm:hidden bg-dark-surface flex flex-col animate-fade-in">
            <ChatPanel onClose={close} />
          </div>
        </>
      )}

      {/* Mobile FAB (visible only on mobile) */}
      <button
        onClick={toggle}
        className={[
          "fixed bottom-6 right-6 z-[62]",
          "w-14 h-14 rounded-full",
          "flex items-center justify-center",
          "shadow-lg shadow-black/30",
          "transition-all duration-200",
          "sm:hidden", // hide on desktop — activity bar handles it
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
