"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";

type CounterProps = {
  value: number;
  suffix?: string;
  decimals?: number;
};

export default function Counter({ value, suffix = "", decimals = 0 }: CounterProps) {
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      el.textContent = `${value.toFixed(decimals)}${suffix}`;
      return;
    }

    const counter = { val: 0 };
    const tween = gsap.to(counter, {
      val: value,
      duration: 1.8,
      ease: "power3.out",
      scrollTrigger: {
        trigger: el,
        start: "top 85%",
        once: true,
      },
      onUpdate: () => {
        el.textContent = `${counter.val.toFixed(decimals)}${suffix}`;
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [value, suffix, decimals]);

  return <span ref={ref}>{`0${suffix}`}</span>;
}
