"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SectionHeading } from "@/components/ui/SectionHeading";

const MODULES = [
  { code: "PE", label: "Particle Engineering" },
  { code: "FS", label: "Formulation Stability" },
  { code: "DC", label: "Device Calibration" },
  { code: "DR", label: "Dose-Response Modeling" },
];

export default function Technology() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const mediaRef = useRef<HTMLDivElement | null>(null);
  const modulesRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // `preload="none"` (no autoPlay attribute) until this panel is actually
  // about to enter view — see the matching comment in Production.tsx.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  // Header only — the media panel and the module badges each get their own
  // purpose-built entrance below instead of joining this generic batch, so
  // the section reads as three deliberate beats (headline settles, media
  // grows in, modules land) rather than one flat everything-fades-together.
  useScrollReveal(sectionRef, { y: 32, blur: 10, duration: 1, stagger: 0.15 });

  // Media panel grows AND fades in as one scrub-driven tween (not a
  // separate batch fade layered underneath it, which was fighting this
  // same element's scale/radius change and reading as jittery rather than
  // smooth). Tied to normal scroll position, not pinned, so it stays
  // lightweight next to PeopleOrbit's full pin+timeline sequence.
  // Placeholder surface today; swap for the real production video/photo
  // once footage is ready — the tween wraps whatever fills this box either way.
  useEffect(() => {
    const media = mediaRef.current;
    const modules = modulesRef.current;
    if (!media || !modules) return;

    const moduleItems = modules.querySelectorAll("[data-module]");

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(media, { opacity: 1, scale: 1, borderRadius: 12 });
      gsap.set(moduleItems, { opacity: 1, scale: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        media,
        { scale: 0.82, borderRadius: 40, opacity: 0 },
        {
          scale: 1,
          borderRadius: 12,
          opacity: 1,
          ease: "none",
          scrollTrigger: { trigger: media, start: "top 85%", end: "top 35%", scrub: 0.5 },
        }
      );

      // Modules land one at a time right after the media panel has settled
      // — a small delayed pop (back-out overshoot) rather than joining the
      // media's fade, so the sequence reads: headline -> media grows ->
      // disciplines land.
      gsap.from(moduleItems, {
        opacity: 0,
        scale: 0.6,
        y: 16,
        duration: 0.6,
        ease: "back.out(1.8)",
        stagger: 0.1,
        scrollTrigger: { trigger: modules, start: "top 85%", once: true },
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <section id="technology" ref={sectionRef} className="px-6 py-20 text-[color:var(--foreground)] sm:px-10 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center text-center">
          <Eyebrow>Technology</Eyebrow>
          <SectionHeading className="mt-4 max-w-lg">
            Four disciplines, one platform.
          </SectionHeading>
        </div>

        <div
          ref={mediaRef}
          className="relative mt-12 aspect-video w-full origin-center overflow-hidden bg-[color:var(--color-mist)] shadow-xl shadow-black/10 sm:mt-16 dark:bg-[color:var(--color-graphite)]"
        >
          <video
            ref={videoRef}
            src="/video-3.mp4"
            preload="none"
            loop
            muted
            playsInline
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* Same two-gradient culture-green filter as before — kept on top
              of the real footage rather than removed. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,color-mix(in_srgb,var(--color-culture)_35%,transparent),transparent_60%)]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_75%,color-mix(in_srgb,var(--color-culture-dim)_25%,transparent),transparent_55%)]"
          />
        </div>

        <div ref={modulesRef} className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 sm:mt-12 lg:grid-cols-4">
          {MODULES.map((module) => (
            <div
              key={module.code}
              data-module
              className="flex flex-col items-center gap-3 text-center lg:items-start lg:text-left"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--color-culture)]/40 font-[family-name:var(--font-mono)] text-xs font-semibold text-[color:var(--color-culture-dim)]">
                {module.code}
              </span>
              <p className="text-sm font-semibold">{module.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
