"use client";

import { useRef, useEffect } from "react";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";

interface Message {
  _id: string;
  role: "User" | "Assistant";
  content: string;
  createdAt: Date;
}

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
}

export function MessageList({ messages, isLoading = false }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="max-w-3xl mx-auto space-y-4">
        {messages.length === 0 && !isLoading && (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">💬</div>
            <h2 className="text-xl font-semibold text-content-primary mb-2">
              Start a conversation
            </h2>
            <p className="text-content-secondary">
              Send a message to begin chatting with the AI assistant.
            </p>
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble
            key={message._id}
            role={message.role}
            content={message.content}
            timestamp={new Date(message.createdAt)}
          />
        ))}

        {isLoading && <TypingIndicator />}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
