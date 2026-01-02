"use client";

interface TypingIndicatorProps {
  status?: string;
}

export function TypingIndicator({ status }: TypingIndicatorProps) {
  return (
    <div className="flex justify-start animate-fade-in mb-4">
      <div className="flex items-center gap-3">
        {/* Animated dots */}
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        
        {/* Status text */}
        {status && (
          <span className="text-sm text-content-muted italic">
            {status}
          </span>
        )}
      </div>
    </div>
  );
}
