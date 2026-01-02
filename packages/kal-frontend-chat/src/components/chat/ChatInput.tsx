"use client";

import { useState, useRef, useEffect } from "react";
import { Send } from "react-feather";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = "Type a message...",
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="absolute bottom-6 left-0 right-0 px-4 pointer-events-none">
      <form 
        onSubmit={handleSubmit} 
        className="max-w-3xl mx-auto pointer-events-auto"
      >
        <div className="flex items-end gap-3 p-2 rounded-3xl bg-dark-elevated/80 backdrop-blur-xl border border-white/10 shadow-2xl transition-all duration-300 focus-within:bg-dark-elevated focus-within:border-accent/40 focus-within:shadow-accent/5">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              rows={1}
              className="w-full pl-5 pr-4 py-3 bg-transparent border-none resize-none focus:outline-none focus:ring-0 text-content-primary placeholder-content-muted/70 transition-all max-h-48"
            />
          </div>
          <button
            type="submit"
            disabled={!message.trim() || disabled}
            className="p-3 mr-1 mb-1 bg-accent hover:bg-accent-hover disabled:bg-white/5 disabled:cursor-not-allowed disabled:text-content-muted text-white rounded-full transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md"
          >
            <Send className="w-5 h-5 ml-0.5" />
          </button>
        </div>
        <div className="text-center mt-3">
          <p className="text-[10px] text-content-muted/50">
            AI can make mistakes. Please verify important information.
          </p>
        </div>
      </form>
    </div>
  );
}
