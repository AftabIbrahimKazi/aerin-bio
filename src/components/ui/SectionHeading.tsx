import type { ReactNode } from "react";

interface SectionHeadingProps {
  children: ReactNode;
  className?: string;
  /** Adds `data-reveal` so useScrollReveal's section-level effect picks this up. Off when a parent element already carries `data-reveal` instead. */
  reveal?: boolean;
}

export function SectionHeading({ children, className = "", reveal = true }: SectionHeadingProps) {
  return (
    <h2
      {...(reveal ? { "data-reveal": true } : {})}
      className={`text-3xl font-semibold tracking-tight sm:text-4xl ${className}`.trim()}
    >
      {children}
    </h2>
  );
}
