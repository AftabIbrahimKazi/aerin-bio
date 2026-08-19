"use client";

import { useRef } from "react";
import Image from "next/image";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { LinkedInIcon } from "@/components/ui/LinkedInIcon";

type Leader = {
  name: string;
  role: string;
  linkedin: string;
  avatarSrc: string;
};

// Same six people, same photos, as TeamAndPartners.tsx's TEAM array (matched
// by inspecting each photo's apparent gender/ethnicity against the name, not
// just array order) — keep both files in sync if a photo needs reassigning.
const LEADERS: Leader[] = [
  {
    name: "James Okafor",
    role: "Chief Executive Officer",
    linkedin: "https://linkedin.com/in/jamesokafor",
    avatarSrc: "/user-3.avif",
  },
  {
    name: "Dr. Elena Marsh",
    role: "Chief Scientific Officer",
    linkedin: "https://linkedin.com/in/elenamarsh",
    avatarSrc: "/user-7.avif",
  },
  {
    name: "Wei Zhang",
    role: "VP Manufacturing",
    linkedin: "https://linkedin.com/in/weizhang",
    avatarSrc: "/user-6.avif",
  },
  {
    name: "Priya Raman",
    role: "VP Regulatory Affairs",
    linkedin: "https://linkedin.com/in/priyaraman",
    avatarSrc: "/user-5.avif",
  },
  {
    name: "Sofia Delgado",
    role: "Head of Clinical Operations",
    linkedin: "https://linkedin.com/in/sofiadelgado",
    avatarSrc: "/user-4.avif",
  },
  {
    name: "Marcus Villanueva",
    role: "VP Business Development",
    linkedin: "https://linkedin.com/in/marcusvillanueva",
    avatarSrc: "/user-1.avif",
  },
];

export default function Leadership() {
  const sectionRef = useRef<HTMLElement | null>(null);

  useScrollReveal(sectionRef, { stagger: 0.1 });

  return (
    <section id="leadership" ref={sectionRef} className="px-6 py-20 text-[color:var(--foreground)] sm:px-10 sm:py-28">
      <div className="relative mx-auto max-w-6xl">
        <div
          data-reveal
          className="relative overflow-hidden rounded-[2rem] rounded-tr-none bg-[color:var(--background-1)]/90 backdrop-blur-md sm:px-10 px-8 py-14 text-[color:var(--foreground-1)] sm:px-14 sm:py-30"
        >
          {/* Soft radial glow in the corner opposite the cut — echoes the
              culture-green accent without needing an image asset. */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[color:var(--color-culture)]/20 blur-3xl"
          />

          <Eyebrow reveal={false} className="relative">
            Leadership
          </Eyebrow>
          <h2 className="relative mt-6 max-w-lg text-4xl font-semibold tracking-tight sm:text-6xl">
            The people at the helm.
          </h2>
          <p className="relative mt-6 max-w-md text-sm text-[color:var(--foreground-1)]/80 sm:text-base">
            Aerin Bio is led by scientists and operators who&rsquo;ve spent careers turning hard delivery
            problems into approved therapies.
          </p>
        </div>

        <div className="relative z-10 mt-14 grid grid-cols-2 gap-1 px-1 sm:-mt-24 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 sm:gap-6 sm:px-0">
          {LEADERS.map((leader) => (
            <div key={leader.name} data-reveal className="group flex flex-col mx-2 mb-2 sm:mx-4 sm:mb-4 lg:mx-6 lg:mb-6">
              <div className="leader-card-shadow relative aspect-[4/5] overflow-hidden rounded-2xl border bg-[color:var(--color-mist)] dark:bg-[color:var(--color-graphite)]">
                <Image
                  src={leader.avatarSrc}
                  alt={leader.name}
                  fill
                  sizes="(min-width: 640px) 25vw, 50vw"
                  className="object-cover transition-transform duration-300 ease-out group-hover:scale-110"
                />
                {/* Bottom-up culture-green light tint — ties the photo back
                    to the site's accent color without a flat filter over
                    the whole image. */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[color:var(--color-culture)]/35 via-[color:var(--color-culture)]/5 to-transparent"
                />
              </div>

              <p className="mt-4 text-sm text-[color:var(--foreground)]/60">{leader.name}</p>
              <p className="text-sm font-bold uppercase tracking-wide text-[color:var(--color-culture-dim)]">
                {leader.role}
              </p>

              <a
                href={leader.linkedin}
                target="_blank"
                rel="noreferrer"
                aria-label={`${leader.name} on LinkedIn`}
                className="mt-3 flex h-8 w-8 items-center justify-center rounded-full border border-[color:var(--foreground)]/15 text-[color:var(--foreground)]/60 transition-colors duration-300 ease-out hover:border-[color:var(--color-culture)]/50 hover:text-[color:var(--color-culture-dim)]"
              >
                <LinkedInIcon className="h-4 w-4" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
