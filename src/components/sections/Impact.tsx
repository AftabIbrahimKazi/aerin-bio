"use client";

import { useRef } from "react";
import Counter from "@/components/visuals/Counter";
import EkgDivider from "@/components/visuals/EkgDivider";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Eyebrow } from "@/components/ui/Eyebrow";

const STATS = [
  { value: 68, suffix: "%", label: "Deep-Lung\nDeposition Rate" },
  { value: 4200, suffix: "+", label: "Patients\nDosed" },
  { value: 12, suffix: "+", label: "Programs in\nDevelopment" },
  { value: 40, suffix: "+", label: "Scientists &\nEngineers" },
];

export default function Impact() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const labelRefs = useRef<(HTMLParagraphElement | null)[]>([]);

  // Picks exactly one label index: which side of the line the cursor
  // entered from (before/after) decides the axis crossed, and where along
  // the line it entered picks among that side's candidates (e.g. top vs.
  // bottom row on a vertical divider spanning two rows).
  const pickIndex = (
    before: number[],
    after: number[],
    isVertical: boolean,
    clientX: number,
    clientY: number,
    rect: DOMRect
  ): number | undefined => {
    const crossFrac = isVertical
      ? (clientX - rect.left) / rect.width
      : (clientY - rect.top) / rect.height;
    const side = crossFrac < 0.5 ? before : after;
    if (!side.length) return undefined;
    const alongFrac = isVertical
      ? (clientY - rect.top) / rect.height
      : (clientX - rect.left) / rect.width;
    return side[Math.min(side.length - 1, Math.floor(alongFrac * side.length))];
  };

  // Both resolvers below close over `labelRefs` but only ever read
  // `.current` inside the returned callback, which EkgDivider invokes from
  // its own pointer-driven effect (see EkgDivider.tsx's resolveGlowTarget
  // call) — never during Impact's own render. react-hooks/refs can't prove
  // that statically since the closure is passed down as a prop, so it's
  // suppressed at each read with that reasoning.
  const resolver =
    (before: number[], after: number[], isVertical: boolean) =>
    (clientX: number, clientY: number, rect: DOMRect) => {
      const idx = pickIndex(before, after, isVertical, clientX, clientY, rect);
      // eslint-disable-next-line react-hooks/refs -- read happens inside EkgDivider's pointer handler, not during render
      return idx === undefined ? null : labelRefs.current[idx] ?? null;
    };

  // The center vertical divider sits between different neighbors depending
  // on breakpoint: cols 0|1 on the 2-col mobile grid, cols 1|2 on the 4-col
  // desktop grid.
  const resolveCenterVertical = (clientX: number, clientY: number, rect: DOMRect) => {
    const isDesktop = window.matchMedia("(min-width: 640px)").matches;
    const [before, after] = isDesktop ? [[1], [2]] : [[0, 2], [1, 3]];
    const idx = pickIndex(before, after, true, clientX, clientY, rect);
    return idx === undefined ? null : labelRefs.current[idx] ?? null;
  };

  useScrollReveal(sectionRef, { selector: "[data-stat]", stagger: 0.12 });

  return (
    <section
      id="impact"
      ref={sectionRef}
      className="px-6 py-20 text-[color:var(--foreground)] sm:px-10 sm:py-24"
    >
      <div className="mx-auto max-w-6xl">
        <Eyebrow reveal={false} className="text-center sm:text-left">
          By the numbers
        </Eyebrow>

        <div className="relative mt-12 grid grid-cols-2 sm:mt-16 sm:grid-cols-4">
          <EkgDivider orientation="vertical" className="left-1/2" resolveGlowTarget={resolveCenterVertical} />
          <EkgDivider
            orientation="vertical"
            className="left-1/4 hidden sm:block"
            resolveGlowTarget={resolver([0], [1], true)}
          />
          <EkgDivider
            orientation="vertical"
            className="left-3/4 hidden sm:block"
            resolveGlowTarget={resolver([2], [3], true)}
          />
          <EkgDivider
            orientation="horizontal"
            className="top-1/2 sm:hidden"
            resolveGlowTarget={resolver([0, 1], [2, 3], false)}
          />
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              data-stat
              className="flex flex-col items-center gap-2 px-4 py-6 text-center"
            >
              <p className="font-[family-name:var(--font-mono)] text-4xl font-semibold text-[color:var(--color-culture)] sm:text-4xl">
                <Counter value={stat.value} suffix={stat.suffix} />
              </p>
              <p
                ref={(el) => {
                  labelRefs.current[i] = el;
                }}
                className="whitespace-pre-line text-xs uppercase tracking-wide text-[color:var(--foreground)]/60"
              >
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-xs text-[color:var(--foreground)]/40">
          Data as of May 2024
        </p>
      </div>
    </section>
  );
}
