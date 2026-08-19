"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import type { Swiper as SwiperInstance } from "swiper/types";
import "swiper/css";
import "swiper/css/pagination";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SectionHeading } from "@/components/ui/SectionHeading";

const AUTOPLAY_DELAY_MS = 3000;

const POSTS: { category: string; title: string; excerpt: string; date: string; readTime: string; image: string }[] = [
  {
    category: "Research",
    title: "Why deep-lung deposition changes the biologics dosing curve",
    excerpt:
      "A look at the particle-engineering work behind our 68% deposition rate, and what it means for chronic dosing schedules.",
    date: "Apr 18, 2024",
    readTime: "6 min read",
    image: "/blog-3.avif",
  },
  {
    category: "Clinical",
    title: "Inside the Phase II trial: what 4,200 dosed patients taught us",
    excerpt:
      "Adherence, adverse events, and the formulation tweaks that came out of our largest cohort to date.",
    date: "Mar 02, 2024",
    readTime: "8 min read",
    image: "/blog-1.avif",
  },
  {
    category: "Platform",
    title: "Building an inhaler platform that scales across molecules",
    excerpt:
      "How the same delivery architecture is carrying twelve programs in parallel through development.",
    date: "Jan 27, 2024",
    readTime: "5 min read",
    image: "/blog-2.avif",
  },
  {
    category: "Manufacturing",
    title: "Scaling aseptic fill-finish without losing particle integrity",
    excerpt:
      "The process controls that let us move from bench batches to commercial-scale runs without reformulating.",
    date: "Dec 11, 2023",
    readTime: "7 min read",
    image: "/blog-4.avif",
  },
];

export default function Blog() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [swiperInstance, setSwiperInstance] = useState<SwiperInstance | null>(null);

  useScrollReveal(sectionRef, { stagger: 0.12 });

  return (
    <section
      id="blog"
      ref={sectionRef}
      className="px-6 py-20 text-[color:var(--foreground)] sm:px-10 sm:py-24"
    >
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center gap-4 text-center">
          <Eyebrow>Insights &amp; research</Eyebrow>
          <SectionHeading className="max-w-xl">
            Notes from the lab bench and the clinic.
          </SectionHeading>
        </div>

        <div data-reveal className="relative mt-12 sm:mt-16">
          <button
            type="button"
            aria-label="Previous articles"
            onClick={() => swiperInstance?.slidePrev()}
            className="absolute left-1 top-[6.5rem] z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[color:var(--foreground)]/15 bg-[color:var(--background)]/80 text-[color:var(--foreground)]/70 shadow-lg shadow-black/10 backdrop-blur-md transition-colors hover:border-[color:var(--color-culture)]/50 hover:text-[color:var(--color-culture-dim)] sm:flex"
          >
            <span aria-hidden>&lsaquo;</span>
          </button>

          <button
            type="button"
            aria-label="Next articles"
            onClick={() => swiperInstance?.slideNext()}
            className="absolute right-1 top-[6.5rem] z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[color:var(--foreground)]/15 bg-[color:var(--background)]/80 text-[color:var(--foreground)]/70 shadow-lg shadow-black/10 backdrop-blur-md transition-colors hover:border-[color:var(--color-culture)]/50 hover:text-[color:var(--color-culture-dim)] sm:flex"
          >
            <span aria-hidden>&rsaquo;</span>
          </button>

          <div className="blog-swiper sm:px-14">
            <Swiper
              modules={[Autoplay, Pagination]}
              onSwiper={setSwiperInstance}
              spaceBetween={28}
              speed={700}
              loop
              grabCursor
              autoplay={{ delay: AUTOPLAY_DELAY_MS, disableOnInteraction: false, pauseOnMouseEnter: true }}
              pagination={{ clickable: true }}
              breakpoints={{
                0: { slidesPerView: 1.05 },
                640: { slidesPerView: 2 },
                1024: { slidesPerView: 3 },
              }}
            >
              {POSTS.map((post) => (
                <SwiperSlide key={post.title} className="py-2">
                  <article className="group flex h-full flex-col overflow-hidden rounded-2xl bg-[color:var(--background)]/60 shadow-lg shadow-[color:var(--color-culture-dim)]/10 ring-1 ring-transparent transition-[box-shadow,translate] duration-300 ease-out hover:-translate-y-1 hover:shadow-xl hover:shadow-[color:var(--color-culture-dim)]/25 hover:ring-[color:var(--color-culture)]/30">
                    <div className="relative flex h-36 items-end overflow-hidden p-5">
                      <Image
                        src={post.image}
                        alt={post.title}
                        fill
                        sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-300 ease-out group-hover:scale-110"
                      />
                      {/* The original placeholder gradient, kept as a filter
                          over the real photo rather than removed — same
                          "placeholder as filter" treatment as Leadership's
                          bottom-up tint, and it doubles as the scrim that
                          keeps the category badge legible. */}
                      <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[color:var(--color-culture)]/25 via-[color:var(--color-culture-dim)]/15 to-transparent"
                      />
                      {/* Bottom-left radial scrim — the diagonal gradient
                          above fades out toward this exact corner (where
                          items-end + p-5 place the badge), so on a busy
                          photo the badge text was landing on whatever the
                          photo happened to show there. This darkens
                          specifically that corner for contrast. */}
                      <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_100%,color-mix(in_srgb,var(--color-ink)_75%,transparent),transparent_65%)]"
                      />
                      <span className="relative rounded-full bg-[color:var(--color-culture)]/15 px-3 py-1 font-[family-name:var(--font-mono)] text-[0.65rem] font-semibold uppercase tracking-wide text-[color:var(--color-paper)] backdrop-blur-sm">
                        {post.category}
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col gap-3 p-6">
                      <h3 className="text-lg font-semibold leading-snug tracking-tight transition-colors duration-300 ease-out group-hover:text-[color:var(--color-culture-dim)]">
                        {post.title}
                      </h3>
                      <p className="flex-1 text-sm leading-relaxed text-[color:var(--foreground)]/70 sm:text-base">
                        {post.excerpt}
                      </p>
                      <div className="mt-2 flex items-center justify-between text-xs uppercase tracking-wide text-[color:var(--foreground)]/70">
                        <span>{post.date}</span>
                        <span>{post.readTime}</span>
                      </div>
                      <span className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[color:var(--color-culture-dim)]">
                        Read article
                        <span aria-hidden className="transition-transform duration-300 ease-out group-hover:translate-x-1">
                          &rarr;
                        </span>
                      </span>
                    </div>
                  </article>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </div>
    </section>
  );
}
