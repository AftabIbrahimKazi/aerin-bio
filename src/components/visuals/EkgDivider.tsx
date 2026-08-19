"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

type EkgDividerProps = {
  orientation: "vertical" | "horizontal";
  className?: string;
  resolveGlowTarget?: (clientX: number, clientY: number, rect: DOMRect) => HTMLElement | null;
};

const labelTweens = new WeakMap<HTMLElement, gsap.core.Tween>();

function pulseLabel(el: HTMLElement, culture: string) {
  labelTweens.get(el)?.kill();

  const state = { t: 0 };
  const tween = gsap.to(state, {
    t: 1,
    duration: 1,
    ease: "sine.inOut",
    onUpdate: () => {
      const envelope = Math.sin(Math.PI * state.t);
      el.style.transform = `scale(${(1 + 0.12 * envelope).toFixed(3)})`;
      el.style.filter = envelope
        ? `drop-shadow(0 0 ${(envelope * 8).toFixed(2)}px ${culture})`
        : "none";
    },
    onComplete: () => {
      el.style.transform = "";
      el.style.filter = "";
      labelTweens.delete(el);
    },
  });
  labelTweens.set(el, tween);
}

const LENGTH = 200;
const THICKNESS = 24;
const MID = THICKNESS / 2;
const STOP_COUNT = 17;
const STOPS = Array.from({ length: STOP_COUNT }, (_, i) => i / (STOP_COUNT - 1));
const AMPLITUDE = 5;
const CYCLES = 1.75; // ripples visible along the divider at once
const TRAVEL = 1.4; // how far the ripple's phase travels over the run

function buildPath(isVertical: boolean, offsets: number[]) {
  const coords = STOPS.map((t, i) => {
    const along = t * LENGTH;
    const across = MID + offsets[i];
    return isVertical ? `${across},${along}` : `${along},${across}`;
  });
  return `M${coords.join(" L")}`;
}

// A traveling ripple with a smooth rise-and-fall envelope, rather than a
// single static bump — reads as a wave passing through, not a jitter.
function waveOffsets(progress: number) {
  const envelope = Math.sin(Math.PI * progress);
  const phase = progress * TRAVEL * Math.PI * 2;
  return STOPS.map(
    (t) => AMPLITUDE * envelope * Math.sin(CYCLES * Math.PI * 2 * t - phase)
  );
}

export default function EkgDivider({ orientation, className = "", resolveGlowTarget }: EkgDividerProps) {
  const isVertical = orientation === "vertical";
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  const settle = (offsets: number[]) => buildPath(isVertical, offsets);

  const runWave = (clientX?: number, clientY?: number) => {
    const path = pathRef.current;
    if (!path) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    tweenRef.current?.kill();

    const state = { progress: 0 };
    tweenRef.current = gsap.to(state, {
      progress: 1,
      duration: 1.1,
      ease: "sine.inOut",
      onUpdate: () => {
        const envelope = Math.sin(Math.PI * state.progress);
        path.setAttribute("d", settle(waveOffsets(state.progress)));
        path.style.strokeOpacity = String(0.1 + 0.5 * envelope);
        path.style.filter = envelope
          ? `drop-shadow(0 0 ${(envelope * 2.5).toFixed(2)}px var(--color-culture))`
          : "none";
      },
    });

    // Only pointer-driven triggers carry a cursor position, so the entry
    // side (and therefore which single label glows) can be determined —
    // the auto-play-on-scroll trigger animates the line only.
    if (resolveGlowTarget && containerRef.current && clientX !== undefined && clientY !== undefined) {
      const rect = containerRef.current.getBoundingClientRect();
      const target = resolveGlowTarget(clientX, clientY, rect);
      if (target) {
        const culture = getComputedStyle(document.documentElement)
          .getPropertyValue("--color-culture")
          .trim();
        pulseLabel(target, culture);
      }
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          runWave();
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(container);

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      role="presentation"
      tabIndex={0}
      onPointerEnter={(e) => runWave(e.clientX, e.clientY)}
      onFocus={() => runWave()}
      className={`ekg-divider absolute z-10 focus:outline-none ${
        isVertical ? "inset-y-0 w-6 -translate-x-1/2" : "inset-x-0 h-6 -translate-y-1/2"
      } ${className}`}
    >
      <svg
        viewBox={isVertical ? `0 0 ${THICKNESS} ${LENGTH}` : `0 0 ${LENGTH} ${THICKNESS}`}
        preserveAspectRatio="none"
        className="h-full w-full overflow-visible"
        aria-hidden="true"
      >
        <path
          ref={pathRef}
          fill="none"
          stroke="var(--color-culture)"
          strokeOpacity={0.1}
          strokeWidth={1.5}
          strokeLinecap="round"
          d={settle(waveOffsets(0))}
        />
      </svg>
    </div>
  );
}
