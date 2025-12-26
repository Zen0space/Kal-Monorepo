"use client";

import { useEffect, useState } from "react";

interface TypewriterNumberProps {
  value: number;
  suffix?: string;
  className?: string;
}

export function TypewriterNumber({ value, suffix = "", className = "" }: TypewriterNumberProps) {
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const fullText = `${value}${suffix}`;

  useEffect(() => {
    let currentIndex = 0;
    let isDeleting = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const animate = () => {
      if (!isDeleting) {
        // Typing
        if (currentIndex <= fullText.length) {
          setDisplayText(fullText.slice(0, currentIndex));
          currentIndex++;
          timeoutId = setTimeout(animate, 80 + Math.random() * 40);
        } else {
          // Pause at full text, then start deleting
          setIsTyping(false);
          timeoutId = setTimeout(() => {
            isDeleting = true;
            setIsTyping(true);
            animate();
          }, 3000);
        }
      } else {
        // Backspacing
        if (currentIndex > 0) {
          currentIndex--;
          setDisplayText(fullText.slice(0, currentIndex));
          timeoutId = setTimeout(animate, 50 + Math.random() * 30);
        } else {
          // Pause, then start typing again
          isDeleting = false;
          timeoutId = setTimeout(animate, 500);
        }
      }
    };

    animate();

    return () => clearTimeout(timeoutId);
  }, [fullText]);

  return (
    <span className={className}>
      {displayText}
      <span 
        className={`inline-block w-0.5 h-[1em] bg-accent ml-0.5 align-middle ${
          isTyping ? "animate-pulse" : "opacity-0"
        }`}
      />
    </span>
  );
}
