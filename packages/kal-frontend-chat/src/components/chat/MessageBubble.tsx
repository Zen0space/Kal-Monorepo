"use client";

interface MessageBubbleProps {
  role: "User" | "Assistant";
  content: string;
  timestamp?: Date;
}

export function MessageBubble({ role, content, timestamp }: MessageBubbleProps) {
  const isUser = role === "User";

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} animate-fade-in`}
    >
      <div
        className={`max-w-[80%] md:max-w-[70%] px-4 py-3 rounded-2xl ${
          isUser
            ? "bg-chat-user text-white rounded-br-md"
            : "bg-chat-assistant text-content-primary rounded-bl-md"
        }`}
      >
        <p className="whitespace-pre-wrap break-words text-sm md:text-base">
          {content}
        </p>
        {timestamp && (
          <p
            className={`text-xs mt-1 ${
              isUser ? "text-blue-200" : "text-content-muted"
            }`}
          >
            {timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>
    </div>
  );
}
