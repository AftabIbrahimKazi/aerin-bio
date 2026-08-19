"use client";

import { useEffect, type RefObject } from "react";
import { gsap } from "@/lib/gsap";

interface UseScrollRevealOptions {
  /** Selector for the elements to animate, scoped to the section. */
  selector?: string;
  /** Starting Y offset (px) items fall in from. */
  y?: number;
  duration?: number;
  stagger?: number;
  ease?: string;
  /** Starting blur (px) items resolve in from, for sections using the focus-pull entrance instead of a flat fade+rise. */
  blur?: number;
  /** ScrollTrigger `start` position. */
  start?: string;
}

// Every section's scroll-reveal effect was the same four steps — query
// `[data-reveal]` items, check prefers-reduced-motion, run a gsap.context
// tween keyed to a ScrollTrigger, revert on cleanup — repeated in 9 files
// with only the tween numbers differing. This hook is that shape; each
// section supplies just the numbers.
export function useScrollReveal(
  sectionRef: RefObject<HTMLElement | null>,
  options: UseScrollRevealOptions = {}
): void {
  const {
    selector = "[data-reveal]",
    y = 28,
    duration = 0.8,
    stagger,
    ease = "power3.out",
    blur,
    start = "top 75%",
  } = options;

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const items = section.querySelectorAll(selector);
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      if (prefersReducedMotion) {
        gsap.set(items, blur !== undefined ? { opacity: 1, y: 0, filter: "blur(0px)" } : { opacity: 1, y: 0 });
        return;
      }
      gsap.from(items, {
        opacity: 0,
        y,
        ...(blur !== undefined ? { filter: `blur(${blur}px)` } : {}),
        duration,
        ease,
        ...(stagger !== undefined ? { stagger } : {}),
        scrollTrigger: { trigger: section, start, once: true },
      });
    }, section);

    return () => ctx.revert();
  }, [sectionRef, selector, y, duration, stagger, ease, blur, start]);
}
