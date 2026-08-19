"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import CityscapeAnimation from "@/components/visuals/CityscapeAnimation";
import SkyDrift from "@/components/visuals/SkyDrift";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { BTN_FOLD } from "@/lib/buttonStyles";

export default function CTA() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);
  const cityRef = useRef<HTMLDivElement | null>(null);
  const textBoundsRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<"content" | "form">("content");

  useScrollReveal(sectionRef, { y: 24, stagger: 0.12 });

  // The stage is pinned to the taller of the two panels, permanently — so
  // the section's height never shifts when swapping between them. The form
  // panel is measured while briefly forced visible (it's `display: none`
  // at rest, which collapses its scrollHeight to 0 otherwise).
  useEffect(() => {
    const stage = stageRef.current;
    const content = contentRef.current;
    const form = formRef.current;
    if (!stage || !content || !form) return;

    const measure = () => {
      const formDisplay = form.style.display;
      const formVisibility = form.style.visibility;
      form.style.display = "flex";
      form.style.visibility = "hidden";
      const tallest = Math.max(content.scrollHeight, form.scrollHeight);
      form.style.display = formDisplay;
      form.style.visibility = formVisibility;
      stage.style.height = `${tallest}px`;
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const swapTo = (target: "content" | "form") => {
    if (target === panelRef.current) return;
    const stage = stageRef.current;
    const outgoing = target === "form" ? contentRef.current : formRef.current;
    const incoming = target === "form" ? formRef.current : contentRef.current;
    if (!stage || !outgoing || !incoming) {
      panelRef.current = target;
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const direction = target === "form" ? 1 : -1;
    const city = cityRef.current;
    // The form fills most of the stage, so the skyline sinks straight down
    // out of the way — like the camera panning up past it — rather than
    // shrinking in place.
    const cityState = target === "form" ? { y: 130, opacity: 0.4 } : { y: 0, opacity: 1 };

    const finish = () => {
      outgoing.style.display = "none";
      gsap.set(incoming, { pointerEvents: "auto" });
      panelRef.current = target;
    };

    if (prefersReducedMotion) {
      incoming.style.display = "flex";
      gsap.set(incoming, { xPercent: 0, opacity: 1, pointerEvents: "auto" });
      if (city) gsap.set(city, cityState);
      finish();
      return;
    }

    incoming.style.display = "flex";
    gsap.set(incoming, { xPercent: 100 * direction, opacity: 0, pointerEvents: "none" });
    gsap.set(outgoing, { pointerEvents: "none" });

    const tl = gsap.timeline({ onComplete: finish });

    tl.to(outgoing, { xPercent: -100 * direction, opacity: 0, duration: 0.5, ease: "power3.inOut" }, 0)
      .to(incoming, { xPercent: 0, opacity: 1, duration: 0.5, ease: "power3.inOut" }, 0.1);

    if (city) tl.to(city, { ...cityState, duration: 0.6, ease: "power3.inOut" }, 0);
  };

  return (
    <section
      id="cta"
      ref={sectionRef}
      className="relative overflow-hidden bg-[color:var(--background-1)]/90 px-6 py-20 text-center text-[color:var(--foreground-1)] backdrop-blur-md sm:px-10 sm:py-24"
    >
      <SkyDrift textRef={textBoundsRef} />
      <CityscapeAnimation ref={cityRef} />

      <div ref={textBoundsRef} className="relative z-10 mx-auto max-w-2xl">
        <Eyebrow>The future of respiratory medicine</Eyebrow>

        <div ref={stageRef} className="relative mt-12 overflow-hidden sm:mt-16">
          <div
            ref={contentRef}
            className="flex flex-col items-center gap-6"
          >
            <SectionHeading>Breathe in what&rsquo;s next.</SectionHeading>

            <p data-reveal className="max-w-md text-sm text-[color:var(--foreground-1)]/90 sm:text-base">
              We&rsquo;re building a world where biologic medicines are as accessible as a breath.
            </p>

            <button
              type="button"
              data-reveal
              onClick={() => swapTo("form")}
              className={`${BTN_FOLD} mt-2 px-8 py-3`}
            >
              Partner with us
            </button>
          </div>

          <div
            ref={formRef}
            className="absolute inset-x-0 top-0 hidden flex-col items-center gap-5"
          >
            <SectionHeading reveal={false}>Let&rsquo;s talk.</SectionHeading>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                swapTo("content");
              }}
              className="flex w-full max-w-sm flex-col gap-4 text-left"
            >
              <label className="flex flex-col gap-1.5 text-xs uppercase tracking-wide text-[color:var(--foreground-1)]/70">
                Name
                <input
                  type="text"
                  required
                  className="rounded-lg border border-[color:var(--foreground-1)]/25 bg-transparent px-4 py-2.5 text-sm normal-case tracking-normal text-[color:var(--foreground-1)] outline-none transition-colors duration-300 ease-out focus:border-[color:var(--foreground-1)]/60"
                />
              </label>

              <label className="flex flex-col gap-1.5 text-xs uppercase tracking-wide text-[color:var(--foreground-1)]/70">
                Email
                <input
                  type="email"
                  required
                  className="rounded-lg border border-[color:var(--foreground-1)]/25 bg-transparent px-4 py-2.5 text-sm normal-case tracking-normal text-[color:var(--foreground-1)] outline-none transition-colors duration-300 ease-out focus:border-[color:var(--foreground-1)]/60"
                />
              </label>

              <label className="flex flex-col gap-1.5 text-xs uppercase tracking-wide text-[color:var(--foreground-1)]/70">
                Message
                <textarea
                  rows={3}
                  required
                  className="resize-none rounded-lg border border-[color:var(--foreground-1)]/25 bg-transparent px-4 py-2.5 text-sm normal-case tracking-normal text-[color:var(--foreground-1)] outline-none transition-colors duration-300 ease-out focus:border-[color:var(--foreground-1)]/60"
                />
              </label>

              <div className="mt-1 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => swapTo("content")}
                  className="text-xs font-medium uppercase tracking-wide text-[color:var(--foreground-1)]/60 transition-colors hover:text-[color:var(--foreground-1)]"
                >
                  ‹ Back
                </button>

                <button
                  type="submit"
                  className={`${BTN_FOLD} px-8 py-3`}
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
