"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  alpha: number;
  age: number;
  lifespan: number;
  curlStrength: number;
  seed: number;
};

const MAX_PARTICLES_CAP = 600;
const PARTICLES_PER_PX2 = 500 / (1440 * 900);

function curl(x: number, y: number, t: number) {
  const scale = 0.006;
  const n = Math.sin(x * scale + t) + Math.cos(y * scale * 1.3 - t * 0.7);
  const angle = n * Math.PI;
  return { x: Math.cos(angle), y: Math.sin(angle) };
}

function readSmokeColors() {
  const style = getComputedStyle(document.documentElement);
  const core = style.getPropertyValue("--smoke-core-rgb").trim() || "190 238 224";
  const mid = style.getPropertyValue("--smoke-mid-rgb").trim() || "53 208 162";
  const blend = (style.getPropertyValue("--smoke-blend").trim() ||
    "lighter") as GlobalCompositeOperation;
  return { core, mid, blend };
}

type SmokeCanvasProps = {
  className: string;
};

// Shared by SmokeBackground (site-wide, fixed behind everything) and any
// section that needs its own locally-stacked instance — e.g. Hero mounts a
// second one above its opaque photo/mask layers, since those layers sit in
// front of the global canvas and would otherwise hide it entirely for that
// section. Each instance clears its own canvas to transparent every frame
// and only paints semi-transparent particle gradients, so whatever's
// underneath (page background, or Hero's photo/mask) shows through
// wherever a particle isn't currently drawn — no blend-mode trickery
// needed, that transparency is just how canvas already works.
export default function SmokeCanvas({ className }: SmokeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const darkSchemeQuery = window.matchMedia("(prefers-color-scheme: dark)");

    let reduceMotion = reduceMotionQuery.matches;
    let colors = readSmokeColors();

    let width = 0;
    let height = 0;
    let dpr = 1;
    let maxParticles = 0;

    function resize() {
      if (!canvas) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
      maxParticles = Math.min(MAX_PARTICLES_CAP, Math.round(width * height * PARTICLES_PER_PX2));
    }
    resize();

    let pointerX = width / 2;
    let pointerY = height / 2;
    let prevX = pointerX;
    let prevY = pointerY;
    let hasMoved = false;

    function setPointer(x: number, y: number) {
      pointerX = x;
      pointerY = y;
      hasMoved = true;
    }

    function onMouseMove(e: MouseEvent) {
      setPointer(e.clientX, e.clientY);
    }
    function onTouchMove(e: TouchEvent) {
      const touch = e.touches[0];
      if (touch) setPointer(touch.clientX, touch.clientY);
    }
    function onReduceMotionChange() {
      reduceMotion = reduceMotionQuery.matches;
    }
    function onSchemeChange() {
      colors = readSmokeColors();
    }

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("themechange", onSchemeChange);
    reduceMotionQuery.addEventListener("change", onReduceMotionChange);
    darkSchemeQuery.addEventListener("change", onSchemeChange);

    const particles: Particle[] = [];

    function spawnParticle(x: number, y: number, dirX: number, dirY: number, spd: number) {
      const jitter = () => (Math.random() - 0.5) * 16;
      const speedNorm = Math.min(1, spd / 30);
      particles.push({
        x: x + jitter(),
        y: y + jitter(),
        vx: dirX * (0.5 + Math.random() * 0.4),
        vy: dirY * (0.5 + Math.random() * 0.4),
        r: 6 + speedNorm * 10 + Math.random() * 8,
        alpha: 0.05 + speedNorm * 0.09,
        age: 0,
        lifespan: 55 + Math.random() * 45,
        curlStrength: 0.6 + Math.random() * 0.8,
        seed: Math.random() * 1000,
      });
    }

    let rafId = 0;

    function tick(t: number) {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      const dx = pointerX - prevX;
      const dy = pointerY - prevY;
      const speed = Math.hypot(dx, dy);

      if (!reduceMotion && hasMoved && speed > 0.25) {
        const spawnCount = Math.min(14, Math.ceil(speed / 2));
        for (let i = 0; i < spawnCount; i++) {
          if (particles.length < maxParticles) {
            spawnParticle(pointerX, pointerY, dx, dy, speed);
          }
        }
      }

      prevX = pointerX;
      prevY = pointerY;

      ctx.globalCompositeOperation = colors.blend;
      const tSec = t * 0.0009;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.age += 1;

        if (p.age > p.lifespan || reduceMotion) {
          particles.splice(i, 1);
          continue;
        }

        p.vx *= 0.9;
        p.vy *= 0.9;

        const c = curl(p.x + p.seed, p.y + p.seed, tSec);
        p.x += p.vx + c.x * p.curlStrength;
        p.y += p.vy + c.y * p.curlStrength;
        p.r += 0.22;

        const lifeProgress = p.age / p.lifespan;
        const fade = Math.sin((1 - lifeProgress) * Math.PI * 0.5);
        const alpha = p.alpha * fade;

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        grad.addColorStop(0, `rgb(${colors.core} / ${alpha})`);
        grad.addColorStop(0.6, `rgb(${colors.mid} / ${alpha * 0.5})`);
        grad.addColorStop(1, `rgb(${colors.mid} / 0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = "source-over";
      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("themechange", onSchemeChange);
      reduceMotionQuery.removeEventListener("change", onReduceMotionChange);
      darkSchemeQuery.removeEventListener("change", onSchemeChange);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} />;
}
