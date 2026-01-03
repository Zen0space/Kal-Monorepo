"use client";

import Markdown from "react-markdown";

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

  // Assistant message: left-aligned with markdown rendering
  return (
    <div className="w-full mb-4 animate-fade-in">
      <div
        className={[
          "prose prose-sm md:prose-base prose-invert max-w-none",
          // Text colors
          "text-content-primary",
          "prose-headings:text-content-primary prose-headings:font-semibold",
          "prose-strong:text-content-primary prose-strong:font-semibold",
          // Headings spacing
          "prose-h1:text-xl prose-h1:mt-6 prose-h1:mb-3",
          "prose-h2:text-lg prose-h2:mt-5 prose-h2:mb-2",
          "prose-h3:text-base prose-h3:mt-4 prose-h3:mb-2",
          // Paragraphs
          "prose-p:leading-relaxed prose-p:my-3",
          // Lists with better spacing
          "prose-ul:my-3 prose-ul:pl-4",
          "prose-ol:my-3 prose-ol:pl-4",
          "prose-li:my-1.5 prose-li:leading-relaxed",
          // Horizontal rules for section breaks
          "prose-hr:my-4 prose-hr:border-dark-border",
          // First element no top margin
          "[&>*:first-child]:mt-0",
        ].join(" ")}
      >
        <Markdown>{content}</Markdown>
      </div>
    </div>
  );
}
