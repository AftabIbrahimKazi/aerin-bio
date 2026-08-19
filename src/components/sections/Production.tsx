"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { BTN_GLOW } from "@/lib/buttonStyles";
import { scrollToSection } from "@/lib/scrollToSection";

export default function Production() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const primaryRef = useRef<HTMLDivElement | null>(null);
  const secondaryRef = useRef<HTMLDivElement | null>(null);
  const primaryVideoRef = useRef<HTMLVideoElement | null>(null);
  const secondaryVideoRef = useRef<HTMLVideoElement | null>(null);

  // Both videos default to `preload="none"` (no autoPlay attribute either),
  // so nothing downloads until this panel is actually about to enter view —
  // otherwise the browser starts fetching ~940KB combined the moment the
  // page loads, regardless of whether the visitor ever scrolls this far.
  useEffect(() => {
    const videos = [primaryVideoRef.current, secondaryVideoRef.current].filter(
      (video): video is HTMLVideoElement => video !== null
    );
    if (videos.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const video = entry.target as HTMLVideoElement;
          if (entry.isIntersecting) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        }
      },
      { rootMargin: "200px" }
    );

    videos.forEach((video) => observer.observe(video));
    return () => observer.disconnect();
  }, []);

  // Text column — eyebrow, heading, body, CTA. The two placeholder images
  // get their own purpose-built entrance below instead of joining this batch.
  useScrollReveal(sectionRef, { y: 32, blur: 10, duration: 1, stagger: 0.15 });

  // Primary image grows AND fades in as one scrub-driven tween. Secondary
  // image pops in shortly after, once the primary has mostly settled.
  // Placeholder surfaces today; swap for the real production photo/video
  // once footage is ready — the tweens wrap whatever fills these boxes
  // either way.
  useEffect(() => {
    const primary = primaryRef.current;
    const secondary = secondaryRef.current;
    if (!primary || !secondary) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set([primary, secondary], { opacity: 1, scale: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        primary,
        { scale: 0.82, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          ease: "none",
          scrollTrigger: { trigger: primary, start: "top 85%", end: "top 40%", scrub: 0.5 },
        }
      );

      gsap.from(secondary, {
        scale: 0.7,
        opacity: 0,
        duration: 0.6,
        ease: "back.out(1.6)",
        scrollTrigger: { trigger: primary, start: "top 55%", once: true },
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <section id="production" ref={sectionRef} className="px-6 py-20 text-[color:var(--foreground)] sm:px-10 sm:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-16 lg:grid-cols-2 lg:gap-12">
        {/* Media column — primary placeholder image with a smaller
            secondary image overlapping its bottom-right corner, standing in
            for real production photography until it's ready. */}
        <div className="relative mx-auto w-full max-w-sm lg:mx-0 lg:max-w-none">
          <div
            ref={primaryRef}
            className="relative aspect-[4/5] w-full origin-center overflow-hidden rounded-[2rem] bg-[color:var(--color-mist)] shadow-xl shadow-black/10 dark:bg-[color:var(--color-graphite)]"
          >
            <video
              ref={primaryVideoRef}
              src="/video-1.mp4"
              preload="none"
              loop
              muted
              playsInline
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover"
            />
            {/* Same two-gradient culture-green filter as before — kept on
                top of the real footage rather than removed, matching the
                "placeholder as filter" treatment used elsewhere (Blog's
                category-badge scrim, Leadership's bottom-up tint). */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,color-mix(in_srgb,var(--color-culture)_35%,transparent),transparent_60%)]"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,color-mix(in_srgb,var(--color-culture-dim)_25%,transparent),transparent_55%)]"
            />
          </div>

          <div
            ref={secondaryRef}
            className="absolute -bottom-8 -right-4 aspect-video w-2/5 origin-bottom-right overflow-hidden rounded-xl border-4 border-[color:var(--background)] bg-[color:var(--color-graphite)] shadow-xl shadow-black/20 sm:-right-8 dark:bg-[color:var(--color-mist)]"
          >
            <video
              ref={secondaryVideoRef}
              src="/video-2.mp4"
              preload="none"
              loop
              muted
              playsInline
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover"
            />
            {/* Same culture-green filter as the primary panel, kept on top
                rather than removed. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,color-mix(in_srgb,var(--color-culture)_30%,transparent),transparent_65%)]"
            />
          </div>
        </div>

        {/* Text column */}
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <Eyebrow>Production</Eyebrow>
          <SectionHeading className="mt-4 max-w-sm">
            Manufacturing built around the formulation.
          </SectionHeading>
          <p data-reveal className="mt-4 max-w-sm text-sm text-[color:var(--foreground)]/70 sm:text-base">
            Our facilities carry a formulation from a handful of bench-scale vials to commercial-scale aseptic
            fill-finish without reformulating between stages — the same process controls at every scale.
          </p>

          <a
            data-reveal
            href="#capabilities"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("capabilities");
            }}
            className={`${BTN_GLOW} mt-8 inline-flex items-center gap-2 px-6 py-3`}
          >
            See our capabilities
            <span aria-hidden>&rarr;</span>
          </a>
        </div>
      </div>
    </section>
  );
}
