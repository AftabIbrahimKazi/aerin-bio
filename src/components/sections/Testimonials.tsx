"use client";

import { useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SectionHeading } from "@/components/ui/SectionHeading";

const CARD_PALETTE: { bg: string; text: string }[] = [
  { bg: "bg-[color:var(--color-ink)]", text: "text-[color:var(--color-paper)]" },
  { bg: "bg-[color:var(--color-culture-dim)]", text: "text-[color:var(--color-paper)]" },
  { bg: "bg-[color:var(--color-paper)]", text: "text-[color:var(--color-ink)]" },
];

const TESTIMONIALS: { quote: string; name: string; role: string }[] = [
  {
    quote:
      "Aerin's inhaled delivery platform cut our dosing burden dramatically without sacrificing efficacy. It's the kind of result that changes a treatment protocol.",
    name: "Dr. Priya Nandakumar",
    role: "Pulmonologist, Whitfield Respiratory Institute",
  },
  {
    quote:
      "We've partnered with a lot of biologics teams. Aerin is the first that treated deep-lung deposition as an engineering problem, not an afterthought.",
    name: "Marcus Oyelaran",
    role: "VP Business Development, Halvern Therapeutics",
  },
  {
    quote:
      "The trial data spoke for itself, but what stayed with me was how fast the team moved from bench result to patient-ready formulation.",
    name: "Dr. Sofia Reyes",
    role: "Principal Investigator, Coastal Clinical Research",
  },
  {
    quote:
      "For patients managing a chronic condition, adherence is everything. A once-daily inhaled biologic isn't a convenience — it's a different quality of life.",
    name: "Dana Whitcombe",
    role: "Patient Advocate, Breathe Forward Alliance",
  },
  {
    quote:
      "Their regulatory team anticipated questions from reviewers before we asked them. That kind of preparation shortened our review cycle by months.",
    name: "Dr. Elena Vasquez",
    role: "Regulatory Affairs Lead, Northbridge Consulting",
  },
  {
    quote:
      "We've run a lot of manufacturing audits. Aerin's process controls were the tightest we've seen at this stage of scale-up.",
    name: "Tom Achebe",
    role: "VP Quality, Larkspur Biomanufacturing",
  },
];

export default function Testimonials() {
  const sectionRef = useRef<HTMLElement | null>(null);

  useScrollReveal(sectionRef, { stagger: 0.12 });

  return (
    <section
      id="testimonials"
      ref={sectionRef}
      className="relative overflow-hidden px-6 py-20 text-[color:var(--foreground)] sm:px-0 sm:py-24"
    >
      {/* Oversized watermark type, purely decorative — sits behind the card
          stack the way the reference layout uses a giant background word. */}
      <p
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-[45%] -translate-y-1/2 select-none text-center font-[family-name:var(--font-mono)] text-[4.5rem] font-bold uppercase leading-[0.85] tracking-tight text-[color:var(--foreground)]/[0.04] sm:text-[7rem] lg:text-[9rem]"
      >
        <span className="block">Trusted</span>
        <span className="block">Voices</span>
      </p>

      <div className="relative mx-auto max-w-5xl">
        <Eyebrow className="text-center">Testimonials</Eyebrow>

        <SectionHeading className="mt-4 text-center">
          Trusted by clinicians, partners, and patients.
        </SectionHeading>

        {/* -mx-6 sm:-mx-10 cancels the section's own px-6 sm:px-10 for just
            this element — the rotated cards' clip boundary (swiper.css)
            now lands flush at the viewport edge instead of inside a
            visible gutter, reading as an intentional full-bleed edge
            rather than a hard crop. */}
        <div data-reveal className="testimonials-swiper -mx-6 mt-12 sm:-mx-10 sm:mt-16">
          <Swiper
            modules={[Autoplay, Pagination]}
            grabCursor
            centeredSlides
            speed={700}
            loop
            autoplay={{ delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: true }}
            pagination={{ clickable: true }}
            breakpoints={{
              0: { slidesPerView: 1.1, spaceBetween: 20 },
              640: { slidesPerView: 1.6, spaceBetween: -30 },
              1024: { slidesPerView: 2, spaceBetween: -80 },
            }}
          >
            {TESTIMONIALS.map((testimonial, index) => {
              const isEven = index % 2 === 0;
              const tilt = isEven
                ? "sm:-rotate-3 sm:translate-y-4"
                : "sm:rotate-3 sm:-translate-y-4";
              const stacking = isEven ? "z-10" : "z-20";

              // Cycles every 3 cards: dark, green, white.
              const palette = CARD_PALETTE[index % CARD_PALETTE.length];
              const cardBg = palette.bg;
              const cardText = palette.text;

              return (
                <SwiperSlide key={testimonial.name}>
                  <figure
                    className={`flex h-full flex-col items-center gap-6 rounded-3xl ${cardBg} p-8 text-center shadow-xl shadow-[color:var(--color-culture-dim)]/25 transition-transform duration-300 ease-out sm:p-10 ${tilt} ${stacking}`}
                  >
                    <span
                      aria-hidden
                      className={`font-[family-name:var(--font-mono)] text-4xl font-bold leading-none sm:text-5xl ${cardText}`}
                    >
                      &ldquo;
                    </span>

                    <blockquote className={`text-base font-medium leading-relaxed sm:text-lg ${cardText}`}>
                      {testimonial.quote}
                    </blockquote>

                    <figcaption className="flex flex-col gap-1">
                      <span className={`text-sm font-semibold uppercase tracking-wide ${cardText}`}>
                        {testimonial.name}
                      </span>
                      <span className={`text-xs uppercase tracking-wide opacity-50 ${cardText}`}>
                        {testimonial.role}
                      </span>
                    </figcaption>
                  </figure>
                </SwiperSlide>
              );
            })}
          </Swiper>
        </div>
      </div>
    </section>
  );
}
