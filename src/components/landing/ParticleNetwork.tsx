"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type ParticleNetworkProps = { className?: string };

/* ── Deterministic random ── */
function mkRand(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Dot = {
  x: number;
  y: number;
  size: number;
  opacity: number;
  dur: number;
  delay: number;
  drift: number;
  pulseDur: number;
  pulseDelay: number;
};

function makeDots(
  n: number,
  size: [number, number],
  alpha: [number, number],
  speed: [number, number],
  rand: () => number,
): Dot[] {
  return Array.from({ length: n }, () => ({
    x: rand() * 100,
    y: rand() * 100,
    size: size[0] + rand() * (size[1] - size[0]),
    opacity: alpha[0] + rand() * (alpha[1] - alpha[0]),
    dur: speed[0] + rand() * (speed[1] - speed[0]),
    delay: -(rand() * speed[1]),
    drift: Math.floor(rand() * 6),
    pulseDur: 6 + rand() * 6,
    pulseDelay: -(rand() * 12),
  }));
}

/* Connection lines for middle layer */
function makeLines(dots: Dot[], maxDist: number) {
  const lines: { x1: number; y1: number; x2: number; y2: number; o: number }[] = [];
  for (let i = 0; i < dots.length; i++) {
    for (let j = i + 1; j < dots.length; j++) {
      const dx = dots[i].x - dots[j].x;
      const dy = dots[i].y - dots[j].y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < maxDist) {
        lines.push({
          x1: dots[i].x, y1: dots[i].y,
          x2: dots[j].x, y2: dots[j].y,
          o: 0.06 + (1 - d / maxDist) * 0.2,
        });
      }
    }
  }
  return lines;
}

/* ── Generate at module level (deterministic, runs once) ── */
const rand = mkRand(42);
const FAR = makeDots(28, [1, 1.5], [0.1, 0.2], [25, 35], rand);
const MID = makeDots(22, [2, 3], [0.3, 0.5], [15, 25], rand);
const NEAR = makeDots(12, [3, 5], [0.6, 0.9], [10, 18], rand);
const MID_LINES = makeLines(MID, 22);

/* ── Keyframes ── */
const STYLE_CSS = `
@keyframes d0{0%,100%{translate:0 0}25%{translate:28px -18px}50%{translate:-15px 22px}75%{translate:-22px -12px}}
@keyframes d1{0%,100%{translate:0 0}25%{translate:-20px 25px}50%{translate:30px 10px}75%{translate:12px -28px}}
@keyframes d2{0%,100%{translate:0 0}25%{translate:18px 20px}50%{translate:-25px -15px}75%{translate:20px -22px}}
@keyframes d3{0%,100%{translate:0 0}25%{translate:-15px -22px}50%{translate:22px 18px}75%{translate:-28px 10px}}
@keyframes d4{0%,100%{translate:0 0}25%{translate:25px 12px}50%{translate:-18px -25px}75%{translate:-10px 28px}}
@keyframes d5{0%,100%{translate:0 0}25%{translate:-28px 15px}50%{translate:12px -20px}75%{translate:25px 18px}}
@keyframes glow-pulse{0%,100%{scale:1}50%{scale:1.3}}
@media(prefers-reduced-motion:reduce){
  .pn-dot,.pn-dot-pulse{animation:none!important}
}
`;

export function ParticleNetwork({ className }: ParticleNetworkProps) {
  const l1 = useRef<HTMLDivElement>(null);
  const l2 = useRef<HTMLDivElement>(null);
  const l3 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const mqMot = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches || mqMot.matches) return;

    let last = 0;

    function onMove(e: MouseEvent) {
      const now = Date.now();
      if (now - last < 100) return;
      last = now;

      const cx = (e.clientX / window.innerWidth - 0.5) * 2;
      const cy = (e.clientY / window.innerHeight - 0.5) * 2;

      if (l1.current) l1.current.style.transform = `translate(${(-cx * 3).toFixed(1)}px,${(-cy * 3).toFixed(1)}px)`;
      if (l2.current) l2.current.style.transform = `translate(${(-cx * 7).toFixed(1)}px,${(-cy * 7).toFixed(1)}px)`;
      if (l3.current) l3.current.style.transform = `translate(${(-cx * 12).toFixed(1)}px,${(-cy * 12).toFixed(1)}px)`;
    }

    function onLeave() {
      if (l1.current) l1.current.style.transform = "";
      if (l2.current) l2.current.style.transform = "";
      if (l3.current) l3.current.style.transform = "";
    }

    window.addEventListener("mousemove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      {/* eslint-disable-next-line react/no-danger */}
      <style dangerouslySetInnerHTML={{ __html: STYLE_CSS }} />

      {/* Depth vignette — tunnel / deep-void feel */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.4) 100%)",
        }}
      />

      {/* ── Layer 1: Far background (hidden on mobile) ── */}
      <div
        ref={l1}
        className="absolute inset-0 hidden md:block"
        style={{ willChange: "transform", transition: "transform 0.3s ease-out" }}
      >
        {FAR.map((p, i) => (
          <div
            key={`f${i}`}
            className="pn-dot absolute rounded-full"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              backgroundColor: "#8B6914",
              opacity: p.opacity,
              filter: "blur(1px)",
              animation: `d${p.drift} ${p.dur.toFixed(1)}s ${p.delay.toFixed(1)}s linear infinite`,
            }}
          />
        ))}
      </div>

      {/* ── Layer 2: Middle — particles + connection lines ── */}
      <div
        ref={l2}
        className="absolute inset-0"
        style={{ willChange: "transform", transition: "transform 0.3s ease-out" }}
      >
        {/* Static SVG connection lines */}
        <svg className="absolute inset-0 size-full">
          {MID_LINES.map((l, i) => (
            <line
              key={`ml${i}`}
              x1={`${l.x1}%`}
              y1={`${l.y1}%`}
              x2={`${l.x2}%`}
              y2={`${l.y2}%`}
              stroke="#F5A623"
              strokeWidth="0.6"
              strokeOpacity={l.o}
            />
          ))}
        </svg>

        {MID.map((p, i) => (
          <div
            key={`m${i}`}
            className="pn-dot absolute rounded-full"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              backgroundColor: "#F5A623",
              opacity: p.opacity,
              animation: `d${p.drift} ${p.dur.toFixed(1)}s ${p.delay.toFixed(1)}s linear infinite`,
            }}
          />
        ))}
      </div>

      {/* ── Layer 3: Foreground — bright, with glow + pulse ── */}
      <div
        ref={l3}
        className="absolute inset-0"
        style={{ willChange: "transform", transition: "transform 0.3s ease-out" }}
      >
        {NEAR.map((p, i) => (
          <div
            key={`n${i}`}
            className="pn-dot pn-dot-pulse absolute rounded-full"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              backgroundColor: "#FFD60A",
              opacity: p.opacity,
              boxShadow: "0 0 6px rgba(245,166,35,0.4)",
              animation: `d${p.drift} ${p.dur.toFixed(1)}s ${p.delay.toFixed(1)}s linear infinite, glow-pulse ${p.pulseDur.toFixed(1)}s ${p.pulseDelay.toFixed(1)}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
