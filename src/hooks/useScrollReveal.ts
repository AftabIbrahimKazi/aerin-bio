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

    if (prefersReducedMotion) {
      gsap.set(items, blur !== undefined ? { opacity: 1, y: 0, filter: "blur(0px)" } : { opacity: 1, y: 0 });
      return;
    }

    // The hidden starting state is set synchronously so there's no flash
    // of fully-visible content, but the ScrollTrigger itself — which
    // measures `section`'s position to resolve `start` — is created one
    // frame later. Sections mounted alongside a large pinned sequence
    // (e.g. this hook used on TeamAndPartners, right after Hero's pinned
    // mask reveal) can have their trigger created in the same render pass
    // as that pin, before its pin-spacer has actually been inserted —
    // GSAP measures against that stale, too-short page and the reveal
    // fires hundreds of pixels too early. One frame is enough for every
    // mount-time effect (including any earlier pin's spacer insertion) to
    // have settled.
    gsap.set(items, { opacity: 0, y, ...(blur !== undefined ? { filter: `blur(${blur}px)` } : {}) });

    let ctx: ReturnType<typeof gsap.context> | undefined;
    const frame = requestAnimationFrame(() => {
      ctx = gsap.context(() => {
        gsap.to(items, {
          opacity: 1,
          y: 0,
          ...(blur !== undefined ? { filter: "blur(0px)" } : {}),
          duration,
          ease,
          ...(stagger !== undefined ? { stagger } : {}),
          scrollTrigger: { trigger: section, start, once: true },
        });
      }, section);
    });

    return () => {
      cancelAnimationFrame(frame);
      ctx?.revert();
    };
  }, [sectionRef, selector, y, duration, stagger, ease, blur, start]);
}
