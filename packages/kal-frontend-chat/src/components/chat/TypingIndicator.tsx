"use client";

export function TypingIndicator() {
  return (
    <div className="flex justify-start animate-fade-in">
      <div className="bg-chat-assistant px-4 py-3 rounded-2xl rounded-bl-md">
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-content-secondary rounded-full typing-dot" />
          <div className="w-2 h-2 bg-content-secondary rounded-full typing-dot" />
          <div className="w-2 h-2 bg-content-secondary rounded-full typing-dot" />
        </div>
      </div>
    </div>
  );
}
