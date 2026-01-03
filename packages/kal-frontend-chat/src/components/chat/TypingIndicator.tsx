"use client";

import { useEffect, useState } from "react";

interface TypingIndicatorProps {
  status?: string;
}

const THINKING_STAGES = [
  "Understanding your request...",
  "Checking Kalori API...",
  "Searching food database...",
  "Analyzing nutrition data...",
  "Generating response...",
];

export function TypingIndicator({ status }: TypingIndicatorProps) {
  const [currentStage, setCurrentStage] = useState(0);

  // Cycle through stages every 3 seconds if no specific status
  useEffect(() => {
    if (status) {
      setCurrentStage(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStage((prev) => (prev + 1) % THINKING_STAGES.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [status]);

  const displayStatus = status || THINKING_STAGES[currentStage];

  return (
    <div className="flex justify-start animate-fade-in mb-4">
      <div className="flex items-center gap-3">
        {/* Animated dots */}
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>

        {/* Status text with fade transition */}
        <span className="text-sm text-content-muted italic transition-opacity duration-300">
          {displayStatus}
        </span>
      </div>
    </div>
  );
}
