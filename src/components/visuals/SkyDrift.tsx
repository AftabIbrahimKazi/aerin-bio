"use client";

import { useEffect, useRef, type RefObject } from "react";
import { gsap } from "@/lib/gsap";

// public/cloud-a.svg, public/cloud-b.svg, public/bird-a.svg and
// public/bird-b.svg are tight crops of individual shapes from stock
// cloud/bird bundles, recolored to the moon's baked tone (see
// cityscape.svg's recolor script — an <img>-loaded SVG can't read CSS
// custom properties, so the color is baked rather than var(--foreground-1)).
//
// Each entry gets its own vertical lane (top %), spaced further apart
// than any element's own height, so clouds and birds can never overlap
// regardless of their independent horizontal timing — no per-frame
// collision check needed, just kept out of each other's row.
const CLOUDS: { src: string; top: string; width: number; duration: number; delay: number }[] = [
  { src: "/cloud-a.svg", top: "6%", width: 150, duration: 52, delay: 0 },
  { src: "/cloud-b.svg", top: "38%", width: 120, duration: 64, delay: 20 },
];

const BIRDS: { src: string; top: string; width: number; duration: number; delay: number }[] = [
  { src: "/bird-a.svg", top: "24%", width: 30, duration: 20, delay: 6 },
  { src: "/bird-b.svg", top: "56%", width: 26, duration: 24, delay: 16 },
];

// How far outside the text's horizontal bounds a drifting element needs
// to be before it's back at full opacity.
const FADE_MARGIN = 140;
const MIN_OPACITY = 0.05;

function fadeFactor(centerX: number, zone: { left: number; right: number } | null) {
  if (!zone) return 1;
  const dist = centerX < zone.left ? zone.left - centerX : centerX > zone.right ? centerX - zone.right : 0;
  const t = Math.min(1, dist / FADE_MARGIN);
  return MIN_OPACITY + (1 - MIN_OPACITY) * t;
}

// Clouds/birds for the CTA backdrop. They drift across the section's
// full width — not confined to side gutters — and fade out smoothly as
// they approach the text column's horizontal bounds (textRef, measured
// live) instead of being hard-clipped or masked by a filter; that's what
// keeps them off the copy, and it reads as the element itself dimming
// rather than a wall it bounces off. Confined vertically to the sky
// above the cityscape band via the bottom-40/sm:bottom-56 cutoff.
export default function SkyDrift({ textRef }: { textRef: RefObject<HTMLDivElement | null> }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const zoneRef = useRef<{ left: number; right: number } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const text = textRef.current;
    if (!container || !text) return;

    const measure = () => {
      const containerRect = container.getBoundingClientRect();
      const textRect = text.getBoundingClientRect();
      zoneRef.current = {
        left: textRect.left - containerRect.left,
        right: textRect.right - containerRect.left,
      };
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [textRef]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const els = Array.from(container.querySelectorAll<HTMLElement>("[data-drift]"));
    const tweens = els.map((el) => {
      const width = Number(el.dataset.width);
      const duration = Number(el.dataset.duration);
      const delay = Number(el.dataset.delay);

      // top/width are per-instance (CLOUDS/BIRDS), so they can't be static
      // Tailwind classes — set imperatively here rather than via a JSX
      // `style` attribute, same as the x/opacity writes below.
      gsap.set(el, { top: el.dataset.top, width });

      if (prefersReducedMotion) {
        gsap.set(el, { x: 0, opacity: 1 });
        return null;
      }

      return gsap.fromTo(
        el,
        { x: -width },
        {
          x: () => container.clientWidth + width,
          duration,
          delay,
          repeat: -1,
          ease: "none",
          onUpdate() {
            const x = Number(gsap.getProperty(el, "x"));
            const opacity = fadeFactor(x + width / 2, zoneRef.current);
            gsap.set(el, { opacity });
          },
        },
      );
    });

    return () => {
      tweens.forEach((t) => t?.kill());
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 bottom-40 z-0 hidden lg:block sm:bottom-56"
    >
      {[...CLOUDS, ...BIRDS].map((item, i) => (
        // eslint-disable-next-line @next/next/no-img-element -- decorative local SVG, GSAP-driven width; same reasoning as CityscapeAnimation.tsx
        <img
          key={`${item.src}-${i}`}
          data-drift
          data-top={item.top}
          data-width={item.width}
          data-duration={item.duration}
          data-delay={item.delay}
          src={item.src}
          alt=""
          className="absolute left-0"
        />
      ))}
    </div>
  );
}
