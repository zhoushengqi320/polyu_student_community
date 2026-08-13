"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

type HomeScrollRevealProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
};

export function HomeScrollReveal({
  children,
  className,
  delay = 0,
}: HomeScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applyMotionPreference = () => {
      const prefersReduced = motionQuery.matches;
      setReduceMotion(prefersReduced);
      if (prefersReduced) {
        setVisible(true);
      }
    };

    applyMotionPreference();
    motionQuery.addEventListener("change", applyMotionPreference);

    if (motionQuery.matches) {
      return () => motionQuery.removeEventListener("change", applyMotionPreference);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) {
          setVisible(entry.isIntersecting);
        }
      },
      { threshold: [0, 0.12, 0.25], rootMargin: "0px 0px -10% 0px" },
    );

    observer.observe(element);
    return () => {
      observer.disconnect();
      motionQuery.removeEventListener("change", applyMotionPreference);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none",
        visible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0",
        className,
      )}
      style={{ transitionDelay: visible && !reduceMotion ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}
