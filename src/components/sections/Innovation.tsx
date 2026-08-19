"use client";

import { useRef } from "react";
import DeliveryPathwayDiagram from "@/components/visuals/DeliveryPathwayDiagram";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SectionHeading } from "@/components/ui/SectionHeading";

export default function Innovation() {
  const sectionRef = useRef<HTMLElement | null>(null);

  // Focus-pull instead of a flat fade+rise — mist resolving into focus, the
  // same metaphor the hero's cursor-disturbed smoke uses.
  useScrollReveal(sectionRef, { y: 32, blur: 10, duration: 1, stagger: 0.15 });

  return (
    <section id="innovation" ref={sectionRef} className="px-6 py-20 text-[color:var(--foreground)] sm:px-10 sm:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <Eyebrow>Innovation</Eyebrow>
          <SectionHeading className="mt-4 max-w-md">
            The shortest path to the lung is through the lung.
          </SectionHeading>
          <p data-reveal className="mt-4 max-w-md text-sm text-[color:var(--foreground)]/70 sm:text-base">
            Injected biologics take the long way — into the bloodstream, diluted by systemic circulation, before a
            fraction ever reaches the airway. Inhaled delivery skips the detour: the dose meets the target tissue
            directly, at the concentration it was engineered for.
          </p>
        </div>

        {/* No data-reveal here — the diagram already has its own bespoke
            stroke-draw entrance (DeliveryPathwayDiagram); layering the
            generic blur/fade batch on top of it just muddies both. */}
        <div className="w-full max-w-md justify-self-center lg:max-w-none lg:justify-self-stretch">
          <DeliveryPathwayDiagram />
        </div>
      </div>
    </section>
  );
}
