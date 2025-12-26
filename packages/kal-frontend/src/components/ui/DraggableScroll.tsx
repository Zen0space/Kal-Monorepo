"use client";

import { useRef, useState, type MouseEvent } from "react";

interface DraggableScrollProps {
  children: React.ReactNode;
  className?: string;
}

export function DraggableScroll({ children, className = "" }: DraggableScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isDown, setIsDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const onMouseDown = (e: MouseEvent) => {
    if (!ref.current) return;
    setIsDown(true);
    ref.current.style.cursor = "grabbing";
    setStartX(e.pageX - ref.current.offsetLeft);
    setScrollLeft(ref.current.scrollLeft);
  };

  const onMouseLeave = () => {
    if (!ref.current) return;
    setIsDown(false);
    ref.current.style.cursor = "grab";
  };

  const onMouseUp = () => {
    if (!ref.current) return;
    setIsDown(false);
    ref.current.style.cursor = "grab";
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!isDown || !ref.current) return;
    e.preventDefault();
    const x = e.pageX - ref.current.offsetLeft;
    const walk = x - startX; // 1:1 scroll speed
    ref.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <div
      ref={ref}
      className={`overflow-x-auto cursor-grab select-none ${className}`}
      onMouseDown={onMouseDown}
      onMouseLeave={onMouseLeave}
      onMouseUp={onMouseUp}
      onMouseMove={onMouseMove}
    >
      {children}
    </div>
  );
}
