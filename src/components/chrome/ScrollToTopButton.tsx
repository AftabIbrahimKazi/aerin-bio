"use client";

import { useEffect, useRef, useState } from "react";

const SCROLL_TOP_THRESHOLD = 400;

// Circle math for the progress ring — r fits inside the button's 56px box
// with the same 7px inset the old decorative rings used.
const RING_R = 21;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_R;

// Up-chevron, reused twice for the slide-swap trick below.
function ArrowIcon() {
  return (
    <svg
      aria-hidden
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

// Loosely based on https://uiverse.io/xopc333, adapted two ways:
//   1. The original's two decorative hover-only rings are replaced by one
//      functional ring — an SVG circle whose stroke-dashoffset tracks how
//      far down the page you've scrolled, so it reads as a progress
//      indicator rather than just a hover flourish.
//   2. The icon-swap track slides vertically (up), not horizontally like
//      the original — "scroll to top" is a vertical action, so the icon
//      should exit and re-enter along that same axis. Same mechanic
//      otherwise: two identical icons in a track twice the button's
//      height, sliding by exactly one button-height (-translate-y-14,
//      56px) on hover.
export default function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  // Ref, not state — read inside the scroll handler without re-subscribing
  // the listener every time it changes.
  const returningRef = useRef(false);

  useEffect(() => {
    function onScroll() {
      const scrollTop = window.scrollY;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;

      // Once a click-triggered scroll-to-top actually reaches the top, stop
      // overriding the normal threshold-based visibility.
      if (returningRef.current && scrollTop <= 0) {
        returningRef.current = false;
      }

      setProgress(scrollable > 0 ? Math.min(1, scrollTop / scrollable) : 0);
      // Kept visible for the whole return trip even once scrollTop drops
      // under the threshold, so the ring's unwind-to-zero is actually seen
      // instead of the button fading out mid-animation.
      setVisible(scrollTop > SCROLL_TOP_THRESHOLD || returningRef.current);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // Driving the scroll ourselves via rAF instead of window.scrollTo's
  // native behavior:"smooth" — some browser/OS combinations animate that on
  // the compositor thread and dispatch scroll events only sparsely (or just
  // once, at the end), so the ring's onScroll-driven progress barely gets a
  // chance to update and the button just snaps from full to hidden. Setting
  // scrollY directly every animation frame guarantees a scroll event (and a
  // progress update) on every frame, regardless of that.
  function scrollToTop() {
    const startY = window.scrollY;
    if (startY <= 0) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.scrollTo(0, 0);
      return;
    }

    returningRef.current = true;
    const duration = 12000;
    const startTime = performance.now();

    function step(now: number) {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      window.scrollTo(0, startY * (1 - eased));
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Scroll to top"
      tabIndex={visible ? 0 : -1}
      className={`group fixed bottom-6 right-6 z-20 h-14 w-14 overflow-hidden rounded-full bg-transparent text-[color:var(--foreground)]/70 transition-[opacity,transform] duration-300 ease-out hover:text-[color:var(--foreground)] ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
      }`}
    >
      <svg aria-hidden viewBox="0 0 56 56" className="pointer-events-none absolute inset-0 h-full w-full">
        <circle cx="28" cy="28" r={RING_R} fill="none" strokeWidth={4} className="stroke-[color:var(--foreground)]/15" />
        <circle
          cx="28"
          cy="28"
          r={RING_R}
          fill="none"
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={RING_CIRCUMFERENCE * (1 - progress)}
          transform="rotate(-90 28 28)"
          className="stroke-[color:var(--color-culture)]"
        />
      </svg>

      <span className="absolute left-0 top-0 flex flex-col transition-transform duration-300 ease-out group-hover:-translate-y-14">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center">
          <ArrowIcon />
        </span>
        <span className="flex h-14 w-14 shrink-0 items-center justify-center">
          <ArrowIcon />
        </span>
      </span>
    </button>
  );
}
