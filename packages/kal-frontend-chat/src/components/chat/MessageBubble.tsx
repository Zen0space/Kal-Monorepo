"use client";

interface MessageBubbleProps {
  role: "User" | "Assistant";
  content: string;
  timestamp?: Date;
}

export function MessageBubble({ role, content }: MessageBubbleProps) {
  const isUser = role === "User";

  if (isUser) {
    // User message: right-aligned with gradient matching user avatar
    return (
      <div className="flex w-full justify-end mb-4 animate-fade-in">
        <div className="max-w-[85%] md:max-w-[70%] px-4 py-2.5 bg-gradient-to-br from-accent to-accent-muted rounded-2xl">
          <p className="text-[15px] leading-relaxed text-white whitespace-pre-wrap">
            {content}
          </p>
        </div>
      </div>
    );
  }

  // Assistant message: left-aligned, no bubble, just clean text
  return (
    <div className="w-full mb-4 animate-fade-in">
      <p className="text-[15px] md:text-base leading-relaxed text-content-primary whitespace-pre-wrap">
        {content}
      </p>
    </div>
  );
}
