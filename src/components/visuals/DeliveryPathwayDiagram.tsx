"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

// Normalized coordinate space the diagram is authored in. The wrapper is
// locked to this same aspect ratio (aspect-[300/220]) so the SVG's internal
// coordinates and the percentage-positioned HTML labels below always agree,
// without ever needing a getBoundingClientRect measurement.
const VIEW_W = 300;
const VIEW_H = 220;

const TRUNK = { x: 150, y: 210 };
const INHALED_END = { x: 90, y: 50 };
const REJECT_POINT = { x: 210, y: 90 };

const INHALED_PATH = `M${TRUNK.x},${TRUNK.y} C130,150 100,110 ${INHALED_END.x},${INHALED_END.y}`;
const INJECTED_PATH = `M${TRUNK.x},${TRUNK.y} C170,150 230,140 ${REJECT_POINT.x},${REJECT_POINT.y}`;

export default function DeliveryPathwayDiagram() {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const inhaledRef = useRef<SVGPathElement | null>(null);
  const injectedRef = useRef<SVGPathElement | null>(null);
  const badgeRef = useRef<HTMLDivElement | null>(null);

  // One-shot draw-in, same stroke-dashoffset technique as PeopleOrbit's
  // branch line and EkgDivider — the solid inhaled route draws first and
  // settles, then the dashed injected route draws in and stops short at the
  // reject badge, reinforcing that it's the route that gets cut off.
  useEffect(() => {
    const wrap = wrapRef.current;
    const inhaled = inhaledRef.current;
    const injected = injectedRef.current;
    const badge = badgeRef.current;
    if (!wrap || !inhaled || !injected || !badge) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const inhaledLength = inhaled.getTotalLength();
    const injectedLength = injected.getTotalLength();
    inhaled.style.strokeDasharray = String(inhaledLength);
    injected.style.strokeDasharray = String(injectedLength);

    if (prefersReducedMotion) {
      inhaled.style.strokeDashoffset = "0";
      injected.style.strokeDashoffset = "0";
      gsap.set(badge, { opacity: 1, scale: 1 });
      return;
    }

    inhaled.style.strokeDashoffset = String(inhaledLength);
    injected.style.strokeDashoffset = String(injectedLength);
    gsap.set(badge, { opacity: 0, scale: 0.5 });

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        const tl = gsap.timeline();
        tl.to(inhaled, { strokeDashoffset: 0, duration: 1, ease: "power2.out" })
          .to(injected, { strokeDashoffset: 0, duration: 0.9, ease: "power2.out" }, 0.25)
          .to(badge, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2)" }, "-=0.15");
        observer.disconnect();
      },
      { threshold: 0.4 }
    );
    observer.observe(wrap);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={wrapRef} className="relative aspect-[300/220] w-full">
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="none"
        className="h-full w-full overflow-visible"
        aria-hidden="true"
      >
        <path
          ref={injectedRef}
          d={INJECTED_PATH}
          fill="none"
          stroke="var(--foreground)"
          strokeOpacity={0.25}
          strokeWidth={0.5}
          strokeLinecap="round"
          strokeDasharray="5"
        />
        <path
          ref={inhaledRef}
          d={INHALED_PATH}
          fill="none"
          stroke="var(--color-culture)"
          strokeWidth={0.5}
          strokeLinecap="round"
          className="drop-shadow-[0_0_4px_var(--color-culture-dim)]"
        />
        <circle cx={TRUNK.x} cy={TRUNK.y} r={2.5} fill="var(--color-culture)" />
      </svg>

      {/* Trunk label — the dose, where both routes begin. Position is
          TRUNK's coordinate expressed as a literal left-[%]/top-[%] class
          (hand-computed from the shared VIEW_W/VIEW_H below) rather than the
          JSX `style` prop, which src forbids — see css-standards RULE 14. */}
      <div className="absolute left-[50%] bottom-[-10%] sm:bottom-[-7%] xl:bottom-[-5%] -translate-x-1/2 -translate-y-full text-center">
        <p className="font-[family-name:var(--font-mono)] text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[color:var(--foreground)]/50 whitespace-nowrap">
          The dose
        </p>
      </div>

      {/* Inhaled route — the accepted, direct path. Position is INHALED_END. */}
      <div className="absolute left-[30%] top-[22.5%] max-w-[9rem] -translate-x-1/2 -translate-y-[calc(100%+0.5rem)] text-center">
        <p className="font-[family-name:var(--font-mono)] text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--color-culture)]">
          Inhaled
        </p>
        <p className="mt-1 text-xs text-[color:var(--foreground)]/70">Direct to the lung</p>
      </div>

      {/* Injected route — rejected before it arrives, same "reject badge"
          device the reference tree diagram uses for pruned branches.
          Position is REJECT_POINT. */}
      <div
        ref={badgeRef}
        className="absolute left-[70%] top-[36.5%] flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 whitespace-nowrap"
      >
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-signal)] text-[0.6rem] font-bold leading-none text-white">
          &times;
        </span>
        <span className="text-xs text-[color:var(--foreground)]/60">Diluted by systemic circulation</span>
      </div>
    </div>
  );
}
