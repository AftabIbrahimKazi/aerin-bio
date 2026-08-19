"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ThemeToggle from "@/components/chrome/ThemeToggle";
import { BTN_GLOW } from "@/lib/buttonStyles";
import { scrollToSection } from "@/lib/scrollToSection";

const NAV_LINKS = [
  { href: "#innovation", label: "Innovation" },
  { href: "#technology", label: "Technology" },
  { href: "#capabilities", label: "Capabilities" },
  { href: "#impact", label: "Impact" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    // Hero is a GSAP-pinned section (see Hero.tsx) — its pin-spacer expands
    // to cover the section's full scroll distance, so #hero's own
    // getBoundingClientRect().bottom already accounts for that and reflects
    // "has the entire hero sequence scrolled past" correctly. Falls back to
    // one viewport height if the element isn't found (defensive only —
    // #hero always renders as the first section).
    const onScroll = () => {
      const hero = document.getElementById("hero");
      const pastPoint = hero ? hero.getBoundingClientRect().bottom : window.innerHeight;
      setPastHero(pastPoint <= 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const visible = !pastHero || hovering || menuOpen;

  return (
    <>
      {/* Thin hover-catch strip pinned to the very top edge. The header
          itself can't receive a mouseenter while translated off-screen —
          this always-present sliver is what lets hovering near the top
          nudge it back into view. */}
      <div className="fixed inset-x-0 top-0 z-20 h-3" onMouseEnter={() => setHovering(true)} />

      <header
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        className={`sticky top-0 z-20 border-b border-[color:var(--color-mist)]/20 bg-[color:var(--background)]/70 backdrop-blur-md dark:border-[color:var(--color-graphite)]/60 ${
          visible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 sm:px-10">
          <Link href="/" className="font-[family-name:var(--font-mono)] text-sm font-semibold tracking-tight">
            Aerin Bio
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection(link.href.slice(1));
                }}
                className="link-shine text-sm"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="#cta"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection("cta");
              }}
              className={`${BTN_GLOW} px-4 py-2`}
            >
              Request a technical brief
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />

            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              aria-label="Toggle navigation menu"
              className="group flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--foreground)]/15 md:hidden"
            >
              <span className="sr-only">Menu</span>
              <div className="flex flex-col items-center gap-1.5">
                {/* Top + bottom bars rotate into an X on open (classic
                    3-bar hamburger morph); the middle bar just fades out.
                    Each bar's knob (from
                    https://uiverse.io/vinodjangid07 — was a purple ::before
                    circle, retthemed to --color-culture here) slides to the
                    opposite side on hover while closed, and fades out once
                    open so it doesn't ride along with the rotated line. */}
                <span
                  className={`relative h-px w-4 rounded-full bg-[color:var(--foreground)] transition-transform duration-300 ease-out ${
                    menuOpen ? "translate-y-[7px] rotate-45" : ""
                  }`}
                >
                  <span
                    className={`absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-[6px] -translate-y-1/2 rounded-full border-2 border-[color:var(--background)] bg-[color:var(--color-culture)] shadow-[0_0_5px_var(--color-culture)] transition-[transform,opacity] duration-300 ease-out group-hover:translate-x-[6px] ${
                      menuOpen ? "opacity-0" : ""
                    }`}
                  />
                </span>
                <span
                  className={`relative h-px w-4 rounded-full bg-[color:var(--foreground)] transition-opacity duration-300 ease-out ${
                    menuOpen ? "opacity-0" : ""
                  }`}
                >
                  <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-y-1/2 translate-x-[6px] rounded-full border-2 border-[color:var(--background)] bg-[color:var(--color-culture)] shadow-[0_0_5px_var(--color-culture)] transition-transform duration-300 ease-out group-hover:-translate-x-[6px]" />
                </span>
                <span
                  className={`relative h-px w-4 rounded-full bg-[color:var(--foreground)] transition-transform duration-300 ease-out ${
                    menuOpen ? "-translate-y-[7px] -rotate-45" : ""
                  }`}
                >
                  <span
                    className={`absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-[6px] -translate-y-1/2 rounded-full border-2 border-[color:var(--background)] bg-[color:var(--color-culture)] shadow-[0_0_5px_var(--color-culture)] transition-[transform,opacity] duration-300 ease-out group-hover:translate-x-[6px] ${
                      menuOpen ? "opacity-0" : ""
                    }`}
                  />
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Grid-rows 0fr->1fr is the only way to transition to an intrinsic
            ("auto") height — animating max-height needs a fixed guess that
            either clips a taller nav or leaves a gap under a shorter one.
            The nav stays mounted (not conditionally rendered) so the
            collapse/expand can transition instead of snapping. */}
        <nav
          id="mobile-nav"
          aria-hidden={!menuOpen}
          className={`grid overflow-hidden transition-[grid-template-rows] duration-300 ease-out md:hidden ${
            menuOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="flex min-h-0 flex-col gap-1 overflow-hidden border-t border-[color:var(--color-mist)]/20 px-6  dark:border-[color:var(--color-graphite)]/60">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  setMenuOpen(false);
                  scrollToSection(link.href.slice(1));
                }}
                tabIndex={menuOpen ? 0 : -1}
                className="link-shine py-2 text-sm"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="#cta"
              onClick={(e) => {
                e.preventDefault();
                setMenuOpen(false);
                scrollToSection("cta");
              }}
              tabIndex={menuOpen ? 0 : -1}
              className={`${BTN_GLOW} mt-2 px-4 py-2 mb-4 text-center`}
            >
              Request a technical brief
            </Link>
          </div>
        </nav>
      </header>
    </>
  );
}
