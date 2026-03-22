"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type ParticleNetworkProps = {
  className?: string;
};

/* ── Seed types ── */
type ParticleSeed = {
  /** Position as % of container */
  x: number;
  y: number;
  /** Dot size in px */
  size: number;
  /** Base opacity 0-1 */
  opacity: number;
  /** CSS color */
  color: string;
  /** Drift range in px */
  driftX: number;
  driftY: number;
  /** Animation duration in seconds */
  duration: number;
  /** Start delay in seconds */
  delay: number;
  /** Pulse opacity duration */
  pulseDuration: number;
};

type LineSeed = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  opacity: number;
  duration: number;
  delay: number;
};

/* ── Palette ── */
const COLORS = [
  "rgba(245,166,35,",   // brand orange-gold
  "rgba(255,214,10,",   // bright yellow
  "rgba(224,144,0,",    // deep amber
  "rgba(255,241,204,",  // cream highlight
];

const CONNECTION_DISTANCE_PCT = 14; // % of container diagonal

/* ── Deterministic seeded random (mulberry32) so SSR/CSR match ── */
function mulberry32(seed: number) {
  return function rand() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateParticles(count: number, rand: () => number): ParticleSeed[] {
  const particles: ParticleSeed[] = [];

  for (let i = 0; i < count; i++) {
    const roll = rand();
    /* 3-tier sizing: dust 55%, medium 33%, accent 12% */
    const size =
      roll < 0.55
        ? 1.2 + rand() * 1.0
        : roll < 0.88
          ? 2.0 + rand() * 1.4
          : 3.0 + rand() * 1.8;

    const isBright = rand() < 0.18;
    const opacity = isBright
      ? 0.55 + rand() * 0.4
      : 0.15 + rand() * 0.35;

    const colorIdx = Math.min(
      COLORS.length - 1,
      Math.floor(rand() * COLORS.length + (isBright ? 0.3 : 0)),
    );

    particles.push({
      x: rand() * 100,
      y: rand() * 100,
      size,
      opacity,
      color: COLORS[colorIdx],
      driftX: 15 + rand() * 30,
      driftY: 15 + rand() * 30,
      duration: 18 + rand() * 16,
      delay: -(rand() * 20),
      pulseDuration: 4 + rand() * 6,
    });
  }

  return particles;
}

function generateLines(particles: ParticleSeed[], rand: () => number): LineSeed[] {
  const lines: LineSeed[] = [];
  const maxLines = 45;

  for (let i = 0; i < particles.length && lines.length < maxLines; i++) {
    for (let j = i + 1; j < particles.length && lines.length < maxLines; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < CONNECTION_DISTANCE_PCT) {
        const fade = 1 - dist / CONNECTION_DISTANCE_PCT;
        lines.push({
          x1: particles[i].x,
          y1: particles[i].y,
          x2: particles[j].x,
          y2: particles[j].y,
          opacity: fade * fade * (0.06 + rand() * 0.08),
          duration: 6 + rand() * 8,
          delay: -(rand() * 10),
        });
      }
    }
  }

  return lines;
}

/* ── Keyframes injected once ── */
let stylesInjected = false;

function injectKeyframes() {
  if (stylesInjected || typeof document === "undefined") return;
  stylesInjected = true;

  const style = document.createElement("style");
  style.textContent = `
@keyframes pn-drift {
  0% { translate: 0 0; }
  100% { translate: var(--pn-dx) var(--pn-dy); }
}
@keyframes pn-pulse {
  0%, 100% { opacity: var(--pn-o); }
  50% { opacity: var(--pn-o-peak); }
}
@keyframes pn-line-pulse {
  0%, 100% { opacity: var(--pn-lo); }
  50% { opacity: var(--pn-lo-peak); }
}
`;
  document.head.appendChild(style);
}

/* ── Component ── */

const DESKTOP_COUNT = 60;
const MOBILE_COUNT = 28;
const SEED = 42;

export function ParticleNetwork({ className }: ParticleNetworkProps) {
  const [isMobile, setIsMobile] = useState(false);
  const glowRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  /* Generate seeds deterministically */
  const count = isMobile ? MOBILE_COUNT : DESKTOP_COUNT;
  const rand = mulberry32(SEED);
  const particles = generateParticles(count, rand);
  const lines = generateLines(particles, rand);

  /* Mobile detection + cursor glow */
  useEffect(() => {
    injectKeyframes();

    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const onMediaChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", onMediaChange);

    /* Cursor glow — desktop only, throttled */
    const glow = glowRef.current;
    const container = containerRef.current;
    if (!glow || !container) return () => mq.removeEventListener("change", onMediaChange);

    let lastMove = 0;

    function onPointerMove(e: PointerEvent) {
      if (mq.matches || !glow || !container) return;
      const now = performance.now();
      if (now - lastMove < 100) return;
      lastMove = now;

      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      glow.style.translate = `${x - 120}px ${y - 120}px`;
      glow.style.opacity = "1";
    }

    function onPointerLeave() {
      if (glow) glow.style.opacity = "0";
    }

    container.addEventListener("pointermove", onPointerMove, { passive: true });
    container.addEventListener("pointerleave", onPointerLeave);

    return () => {
      mq.removeEventListener("change", onMediaChange);
      container.removeEventListener("pointermove", onPointerMove);
      container.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
      style={{ contain: "layout paint size" }}
    >
      {/* ── Connection lines (static SVG) ── */}
      <svg
        className="absolute inset-0 size-full"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
      >
        {lines.map((line, i) => (
          <line
            key={i}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="rgb(245,166,35)"
            strokeWidth="0.08"
            strokeLinecap="round"
            style={
              reduceMotion
                ? { opacity: line.opacity }
                : {
                    ["--pn-lo" as string]: line.opacity,
                    ["--pn-lo-peak" as string]: Math.min(line.opacity * 2.2, 0.22),
                    opacity: line.opacity,
                    animation: `pn-line-pulse ${line.duration}s ease-in-out ${line.delay}s infinite`,
                  }
            }
          />
        ))}
      </svg>

      {/* ── Particle dots ── */}
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={
            reduceMotion
              ? {
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  width: p.size,
                  height: p.size,
                  backgroundColor: `${p.color}${p.opacity})`,
                }
              : {
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  width: p.size,
                  height: p.size,
                  backgroundColor: `${p.color}${p.opacity})`,
                  ["--pn-dx" as string]: `${p.driftX}px`,
                  ["--pn-dy" as string]: `${p.driftY}px`,
                  ["--pn-o" as string]: p.opacity,
                  ["--pn-o-peak" as string]: Math.min(p.opacity * 1.8, 0.95),
                  animation: `pn-drift ${p.duration}s ease-in-out ${p.delay}s infinite alternate, pn-pulse ${p.pulseDuration}s ease-in-out ${p.delay}s infinite`,
                  willChange: "translate, opacity",
                }
          }
        />
      ))}

      {/* ── Cursor glow (desktop only) ── */}
      {!isMobile && (
        <div
          ref={glowRef}
          className="pointer-events-none absolute left-0 top-0 size-[240px] rounded-full opacity-0 transition-opacity duration-500"
          style={{
            background:
              "radial-gradient(circle, rgba(245,166,35,0.13) 0%, rgba(245,166,35,0.04) 40%, transparent 70%)",
            willChange: "translate",
          }}
        />
      )}
    </div>
  );
}

/* ── Reduced-motion hook (lightweight, no framer-motion dep) ── */
function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return reduced;
}
