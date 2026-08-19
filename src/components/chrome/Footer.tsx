"use client";

import Link from "next/link";
import type { SVGProps } from "react";
import EkgDivider from "@/components/visuals/EkgDivider";
import { LinkedInIcon } from "@/components/ui/LinkedInIcon";
import { scrollToSection } from "@/lib/scrollToSection";

const FOOTER_LINKS = [
  { href: "#innovation", label: "Innovation" },
  { href: "#technology", label: "Technology" },
  { href: "#capabilities", label: "Capabilities" },
  { href: "#impact", label: "Impact" },
];

const POLICY_LINKS = [
  { href: "#", label: "Privacy Policy" },
  { href: "#", label: "Terms of Service" },
  { href: "#", label: "Cookie Policy" },
];

function XIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M18.9 2H22l-7.6 8.7L23 22h-6.9l-5.4-6.9L4.5 22H1.4l8.2-9.3L1 2h7l4.9 6.3L18.9 2Zm-1.2 18h1.9L7.4 4H5.4l12.3 16Z" />
    </svg>
  );
}

function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden="true" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function YouTubeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M21.6 7.2a2.7 2.7 0 0 0-1.9-1.9C18 5 12 5 12 5s-6 0-7.7.3a2.7 2.7 0 0 0-1.9 1.9A28.3 28.3 0 0 0 2 12a28.3 28.3 0 0 0 .4 4.8 2.7 2.7 0 0 0 1.9 1.9C6 19 12 19 12 19s6 0 7.7-.3a2.7 2.7 0 0 0 1.9-1.9A28.3 28.3 0 0 0 22 12a28.3 28.3 0 0 0-.4-4.8ZM10 15.5v-7l6 3.5-6 3.5Z" />
    </svg>
  );
}

const SOCIAL_LINKS = [
  { href: "https://linkedin.com/company/aerinbio", label: "LinkedIn", Icon: LinkedInIcon },
  { href: "https://x.com/aerinbio", label: "X (Twitter)", Icon: XIcon },
  { href: "https://instagram.com/aerinbio", label: "Instagram", Icon: InstagramIcon },
  { href: "https://youtube.com/@aerinbio", label: "YouTube", Icon: YouTubeIcon },
];

export default function Footer() {
  return (
    <footer className="border-t border-[color:var(--color-mist)]/20 bg-[color:var(--background)]/70 backdrop-blur-md dark:border-[color:var(--color-graphite)]/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10 sm:px-10">
        <div className="grid grid-cols-1 items-center gap-6 text-center sm:grid-cols-3 sm:text-left">
          <div>
            <p className="font-[family-name:var(--font-mono)] text-sm font-semibold tracking-tight">
              Aerin Bio
            </p>
            <p className="mt-1 text-sm text-[color:var(--foreground)]/60">
              Medicine that breathes with you.
            </p>
          </div>

          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-[color:var(--foreground)]/60">
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection(link.href.slice(1));
                }}
                className="link-shine"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-col items-center gap-3 sm:items-end">
            <a href="mailto:hello@aerinbio.example" className="link-shine text-sm">
              hello@aerinbio.example
            </a>
            <div className="flex items-center gap-4">
              {SOCIAL_LINKS.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="text-[color:var(--foreground)]/50 transition-colors hover:text-[color:var(--foreground)]"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="relative grid grid-cols-1 items-center gap-4 pt-6 text-center text-xs text-[color:var(--foreground)]/40 sm:grid-cols-3 sm:text-left">
          <EkgDivider orientation="horizontal" className="top-0" />
          <p>© {new Date().getFullYear()} Aerin Bio. All rights reserved.</p>

          <nav className="flex flex-wrap justify-center gap-x-5 gap-y-1">
            {POLICY_LINKS.map((link) => (
              <Link key={link.label} href={link.href} className="link-shine">
                {link.label}
              </Link>
            ))}
          </nav>

          <p className="sm:text-right">Aerin Bio is a fictional company created for a design exercise.</p>
        </div>
      </div>
    </footer>
  );
}
