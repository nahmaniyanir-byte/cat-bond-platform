"use client";

import { useEffect, useRef } from "react";

interface ScrollRevealProps {
  children: React.ReactNode;
  /** Delay in ms before the reveal transition starts (for staggering siblings) */
  delay?: number;
  className?: string;
}

/**
 * Wraps children in a div that fades+slides into view when scrolled into viewport.
 * Uses the `reveal-on-scroll` / `is-visible` CSS classes from globals.css.
 * Safe to use next to globes, videos, and charts — only affects wrapper opacity/transform.
 */
export function ScrollReveal({ children, delay = 0, className = "" }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Reveal immediately if already in viewport (above-the-fold content)
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.92) {
      const t = setTimeout(() => el.classList.add("is-visible"), delay);
      return () => clearTimeout(t);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const t = setTimeout(() => el.classList.add("is-visible"), delay);
          observer.unobserve(el);
          // clean up the timeout if component unmounts before it fires
          return () => clearTimeout(t);
        }
      },
      { threshold: 0.06, rootMargin: "0px 0px -28px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div ref={ref} className={`reveal-on-scroll ${className}`}>
      {children}
    </div>
  );
}
