import type { ReactNode } from "react";

interface EyebrowProps {
  children: ReactNode;
  className?: string;
  /** Adds `data-reveal` so useScrollReveal's section-level effect picks this up. Off when a parent element already carries `data-reveal` instead. */
  reveal?: boolean;
}

export function Eyebrow({ children, className = "", reveal = true }: EyebrowProps) {
  return (
    <p
      {...(reveal ? { "data-reveal": true } : {})}
      className={`font-[family-name:var(--font-mono)] text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-culture)] ${className}`.trim()}
    >
      {children}
    </p>
  );
}
