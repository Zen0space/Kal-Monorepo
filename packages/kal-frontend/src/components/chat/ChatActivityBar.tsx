"use client";

import { useAtom } from "jotai";
import { useCallback } from "react";
import { MessageCircle } from "react-feather";

import { chatPanelOpenAtom } from "@/atoms/chat";
import { useAuth } from "@/lib/auth-context";

/**
 * Thin right-side activity bar with a chat icon.
 * Always visible on desktop for authenticated users.
 * Hidden on mobile (mobile uses a FAB instead).
 */
export function ChatActivityBar() {
  const { logtoId } = useAuth();
  const [isOpen, setIsOpen] = useAtom(chatPanelOpenAtom);

  const toggle = useCallback(() => setIsOpen((prev) => !prev), [setIsOpen]);

  // Only show for authenticated users
  if (!logtoId) return null;

  return (
    <div
      className={[
        "hidden sm:flex flex-col items-center",
        "w-12 shrink-0",
        "bg-dark-surface border-l border-dark-border",
        "py-4",
      ].join(" ")}
    >
      <button
        onClick={toggle}
        className={[
          "w-9 h-9 rounded-lg",
          "flex items-center justify-center",
          "transition-all duration-150",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
          isOpen ? "bg-accent/15" : "hover:bg-dark-elevated",
        ].join(" ")}
        aria-label={isOpen ? "Close chat" : "Open chat"}
        title={isOpen ? "Close chat" : "Open chat"}
      >
        {/* SVG gradient definition for the icon stroke */}
        <svg width="0" height="0" className="absolute">
          <defs>
            <linearGradient
              id="chat-icon-gradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#34d399" />
            </linearGradient>
          </defs>
        </svg>
        <span
          className={[
            "chat-gradient-icon",
            isOpen ? "opacity-100" : "opacity-60 hover:opacity-100",
            "transition-opacity duration-150",
          ].join(" ")}
        >
          <MessageCircle size={20} />
        </span>
      </button>
    </div>
  );
}
