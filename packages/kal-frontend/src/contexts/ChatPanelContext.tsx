"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

interface ChatPanelContextValue {
  isOpen: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
}

const ChatPanelContext = createContext<ChatPanelContextValue | null>(null);

export function ChatPanelProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  return (
    <ChatPanelContext.Provider value={{ isOpen, toggle, open, close }}>
      {children}
    </ChatPanelContext.Provider>
  );
}

export function useChatPanel() {
  const ctx = useContext(ChatPanelContext);
  if (!ctx) {
    throw new Error("useChatPanel must be used within ChatPanelProvider");
  }
  return ctx;
}
