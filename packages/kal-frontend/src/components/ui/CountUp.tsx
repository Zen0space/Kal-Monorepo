"use client";

import { useEffect, useRef, useState } from "react";
import {
  useMotionValue,
  useSpring,
  useInView,
  type SpringOptions,
} from "framer-motion";

interface CountUpProps {
  value: number;
  duration?: number;
  className?: string;
  formatOptions?: Intl.NumberFormatOptions;
}

const springConfig: SpringOptions = {
  stiffness: 50,
  damping: 30,
  restDelta: 0.5,
};

export function CountUp({
  value,
  className = "",
  formatOptions,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, springConfig);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (isInView && value > 0) {
      motionValue.set(value);
    }
  }, [isInView, value, motionValue]);

  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest) => {
      setDisplay(Math.round(latest).toLocaleString("en-US", formatOptions));
    });
    return unsubscribe;
  }, [springValue, formatOptions]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
