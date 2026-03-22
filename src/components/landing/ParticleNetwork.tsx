"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

type ParticleNetworkProps = {
  className?: string;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseRadius: number;
  baseAlpha: number;
  color: RgbColor;
  depth: number;
  interactionX: number;
  interactionY: number;
  pulsePhase: number;
  pulseSpeed: number;
  sparkTimer: number;
  sparkDuration: number;
  sparkStrength: number;
};

type RgbColor = {
  r: number;
  g: number;
  b: number;
};

/* Warm gold palette — ordered by frequency weight */
const PALETTE: RgbColor[] = [
  { r: 245, g: 166, b: 35 },   // brand orange-gold
  { r: 255, g: 214, b: 10 },   // bright yellow
  { r: 224, g: 144, b: 0 },    // deep amber
  { r: 255, g: 241, b: 204 },  // pale cream highlight
];

const BACKGROUND = "rgb(10 10 10 / 0.04)";
const CONNECTION_DISTANCE = 120;
const INTERACTION_RADIUS = 220;
const MAIN_FRAME_MS = 1000 / 30;
const CURSOR_THROTTLE_MS = 32;
const GRID_CELL_SIZE = CONNECTION_DISTANCE;

function clamp(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v;
}

function rgba(c: RgbColor, a: number) {
  return `rgba(${c.r},${c.g},${c.b},${a})`;
}

function pickCount(width: number, height: number, isMobile: boolean) {
  const area = width * height;
  if (isMobile) return clamp(Math.round(area / 12000), 22, 35);
  return clamp(Math.round(area / 14000), 55, 72);
}

function createParticle(w: number, h: number): Particle {
  const depth = 0.55 + Math.random() * 1.0;
  const speed = (0.12 + Math.random() * 0.22) * depth;
  const angle = Math.random() * Math.PI * 2;

  /* 3-tier sizing: dust / medium / accent */
  const roll = Math.random();
  const baseRadius =
    roll < 0.55
      ? 0.8 + Math.random() * 1.0             // dust
      : roll < 0.88
        ? 1.6 + Math.random() * 1.4            // medium
        : 2.8 + Math.random() * 1.6;           // accent

  const isBright = Math.random() < 0.18;
  const baseAlpha = isBright
    ? 0.78 + Math.random() * 0.22
    : 0.22 + Math.random() * 0.38;

  const color = PALETTE[
    Math.min(
      PALETTE.length - 1,
      Math.floor(Math.random() * PALETTE.length + (isBright ? 0.3 : 0)),
    )
  ];

  return {
    x: Math.random() * w,
    y: Math.random() * h,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: baseRadius,
    baseRadius,
    baseAlpha,
    color,
    depth,
    interactionX: 0,
    interactionY: 0,
    pulsePhase: Math.random() * Math.PI * 2,
    pulseSpeed: 0.001 + Math.random() * 0.002,
    sparkTimer: 0,
    sparkDuration: 0,
    sparkStrength: 0,
  };
}

/** Spatial hash grid — O(n) connection lookups */
function buildGrid(
  positions: Array<{ x: number; y: number }>,
  cellSize: number,
  cols: number,
) {
  const grid = new Map<number, number[]>();
  for (let i = 0; i < positions.length; i++) {
    const key =
      Math.floor(positions[i].y / cellSize) * cols +
      Math.floor(positions[i].x / cellSize);
    const cell = grid.get(key);
    if (cell) cell.push(i);
    else grid.set(key, [i]);
  }
  return grid;
}

export function ParticleNetwork({ className }: ParticleNetworkProps) {
  const reduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    /* Non-null after guard — captured by closures below */
    const host = containerRef.current;
    const surface = canvasRef.current;

    const ctxOrNull = surface.getContext("2d", { alpha: true, desynchronized: true });
    if (!ctxOrNull) return;
    const ctx = ctxOrNull;

    const mqMobile = window.matchMedia("(max-width: 767px)");
    const cursor = { x: 0, y: 0, active: false };
    let rafId = 0;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let particles: Particle[] = [];
    let lastFrame = 0;
    let isVisible = false;
    let hasBeenVisible = false;
    let lastCursorTs = 0;

    /* ── smoothed cursor for trail ── */
    const smoothCursor = { x: 0, y: 0 };

    /* ── resize ── */
    function resize() {
      const rect = host.getBoundingClientRect();
      w = Math.max(1, rect.width);
      h = Math.max(1, rect.height);
      dpr = mqMobile.matches ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);

      surface.width = Math.round(w * dpr);
      surface.height = Math.round(h * dpr);
      surface.style.width = `${w}px`;
      surface.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      particles = Array.from(
        { length: pickCount(w, h, mqMobile.matches) },
        () => createParticle(w, h),
      );
    }

    /* ── cursor events ── */
    function onPointerMove(e: PointerEvent) {
      const now = performance.now();
      if (now - lastCursorTs < CURSOR_THROTTLE_MS) return;
      lastCursorTs = now;

      const rect = host.getBoundingClientRect();
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        cursor.active = false;
        return;
      }
      cursor.x = e.clientX - rect.left;
      cursor.y = e.clientY - rect.top;
      cursor.active = true;
    }

    function onPointerLeave() {
      cursor.active = false;
    }

    /* ── draw ── */
    function drawFrame(ts: number) {
      if (!w || !h) return;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = BACKGROUND;
      ctx.fillRect(0, 0, w, h);

      /* Smooth-interpolate cursor for soft glow trail */
      if (cursor.active) {
        smoothCursor.x += (cursor.x - smoothCursor.x) * 0.12;
        smoothCursor.y += (cursor.y - smoothCursor.y) * 0.12;
      }

      /* ── Cursor radial glow (single gradient, cheap) ── */
      if (cursor.active) {
        const glow = ctx.createRadialGradient(
          smoothCursor.x, smoothCursor.y, 0,
          smoothCursor.x, smoothCursor.y, INTERACTION_RADIUS * 0.9,
        );
        glow.addColorStop(0, "rgba(245,166,35,0.07)");
        glow.addColorStop(0.5, "rgba(245,166,35,0.025)");
        glow.addColorStop(1, "rgba(245,166,35,0)");
        ctx.fillStyle = glow;
        ctx.fillRect(
          smoothCursor.x - INTERACTION_RADIUS,
          smoothCursor.y - INTERACTION_RADIUS,
          INTERACTION_RADIUS * 2,
          INTERACTION_RADIUS * 2,
        );
      }

      /* ── Update particles + collect draw positions ── */
      const positions: Array<{ x: number; y: number; boost: number }> = [];

      for (const p of particles) {
        let boost = 0;

        if (!reduceMotion) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < -14) p.x = w + 14;
          else if (p.x > w + 14) p.x = -14;
          if (p.y < -14) p.y = h + 14;
          else if (p.y > h + 14) p.y = -14;

          /* random spark */
          if (p.sparkTimer <= 0 && Math.random() < 0.002) {
            p.sparkDuration = 22 + Math.random() * 38;
            p.sparkTimer = p.sparkDuration;
            p.sparkStrength = 0.12 + Math.random() * 0.2;
          } else if (p.sparkTimer > 0) {
            p.sparkTimer--;
          }
        }

        /* ── Cursor magnetic attraction ── */
        let targetIx = 0;
        let targetIy = 0;

        if (cursor.active && !reduceMotion) {
          const dx = cursor.x - p.x;
          const dy = cursor.y - p.y;
          const dSq = dx * dx + dy * dy;

          if (dSq < INTERACTION_RADIUS * INTERACTION_RADIUS && dSq > 1) {
            const dist = Math.sqrt(dSq);
            const t = 1 - dist / INTERACTION_RADIUS;
            /* Smooth cubic falloff for magnetic pull */
            const pull = t * t * (3 - 2 * t);
            const shift = (14 + p.depth * 10) * pull;

            targetIx = (dx / dist) * shift;
            targetIy = (dy / dist) * shift;
            boost = pull * 0.35;

            /* Particles near cursor grow slightly */
            p.radius = p.baseRadius * (1 + pull * 0.6);
          } else {
            p.radius = p.baseRadius;
          }
        } else {
          p.radius += (p.baseRadius - p.radius) * 0.1;
        }

        const lerp = reduceMotion ? 1 : 0.09;
        p.interactionX += (targetIx - p.interactionX) * lerp;
        p.interactionY += (targetIy - p.interactionY) * lerp;

        positions.push({
          x: p.x + p.interactionX,
          y: p.y + p.interactionY,
          boost,
        });
      }

      /* ── Connection lines (spatial grid) ── */
      const gridCols = Math.ceil(w / GRID_CELL_SIZE) + 1;
      const grid = buildGrid(positions, GRID_CELL_SIZE, gridCols);

      ctx.lineCap = "round";

      for (let i = 0; i < particles.length; i++) {
        const src = particles[i];
        const sp = positions[i];
        const col = Math.floor(sp.x / GRID_CELL_SIZE);
        const row = Math.floor(sp.y / GRID_CELL_SIZE);

        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const cell = grid.get((row + dr) * gridCols + (col + dc));
            if (!cell) continue;

            for (const j of cell) {
              if (j <= i) continue;

              const tgt = particles[j];
              const tp = positions[j];
              const dx = sp.x - tp.x;
              const dy = sp.y - tp.y;
              const dSq = dx * dx + dy * dy;
              if (dSq > CONNECTION_DISTANCE * CONNECTION_DISTANCE) continue;

              const dist = Math.sqrt(dSq);
              const fade = 1 - dist / CONNECTION_DISTANCE;
              let alpha = fade * fade * (0.12 + (src.depth + tgt.depth) * 0.05);

              /* Cursor proximity brightens connections */
              if (cursor.active) {
                const cursorProx =
                  Math.max(0, 1 - sp.boost * 0) +     // reuse stored boost
                  (sp.boost + tp.boost) * 0.55;
                alpha += cursorProx * fade * 0.18;
              }

              /* Thicker, brighter lines near cursor */
              const lineW = 0.4 + (src.depth + tgt.depth) * 0.15 +
                (sp.boost + tp.boost) * 0.8;

              ctx.beginPath();
              ctx.moveTo(sp.x, sp.y);
              ctx.lineTo(tp.x, tp.y);
              ctx.lineWidth = lineW;
              ctx.strokeStyle = rgba(PALETTE[0], clamp(alpha, 0.06, 0.4));
              ctx.stroke();
            }
          }
        }
      }

      /* ── Draw particles ── */
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const pos = positions[i];

        const pulse = 0.84 + 0.16 * Math.sin(ts * p.pulseSpeed + p.pulsePhase);
        const spark =
          p.sparkTimer > 0 && p.sparkDuration > 0
            ? Math.sin(
                ((p.sparkDuration - p.sparkTimer) / p.sparkDuration) * Math.PI,
              ) * p.sparkStrength
            : 0;

        const alpha = clamp(p.baseAlpha * pulse + pos.boost + spark, 0.12, 1);

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = rgba(p.color, alpha);
        ctx.fill();
      }

      /* ── Small cursor dot (subtle focus point) ── */
      if (cursor.active) {
        ctx.beginPath();
        ctx.arc(smoothCursor.x, smoothCursor.y, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,214,10,0.35)";
        ctx.fill();
      }

      lastFrame = ts;
    }

    /* ── Animation loop ── */
    function animate(ts: number) {
      if (!isVisible) return;
      if (ts - lastFrame >= MAIN_FRAME_MS) drawFrame(ts);
      rafId = requestAnimationFrame(animate);
    }

    function start() {
      if (rafId) return;
      rafId = requestAnimationFrame(animate);
    }

    function stop() {
      if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    }

    /* ── Setup ── */
    const resizeObs = new ResizeObserver(() => {
      resize();
      if (reduceMotion) drawFrame(lastFrame);
    });
    resizeObs.observe(host);

    host.addEventListener("pointermove", onPointerMove, { passive: true });
    host.addEventListener("pointerleave", onPointerLeave);
    mqMobile.addEventListener("change", () => { resize(); drawFrame(lastFrame); });

    const visObs = new IntersectionObserver(
      ([entry]) => {
        const vis = entry?.isIntersecting ?? false;
        isVisible = vis;
        if (vis && !hasBeenVisible) {
          hasBeenVisible = true;
          resize();
          if (reduceMotion) drawFrame(performance.now());
          else start();
        } else if (vis && !reduceMotion) {
          start();
        } else if (!vis) {
          stop();
        }
      },
      { threshold: 0.02 },
    );
    visObs.observe(host);

    return () => {
      stop();
      resizeObs.disconnect();
      visObs.disconnect();
      host.removeEventListener("pointermove", onPointerMove);
      host.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [reduceMotion]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <canvas
        ref={canvasRef}
        className="size-full"
        style={{
          contain: "layout paint size",
          transform: "translateZ(0)",
          willChange: reduceMotion ? "auto" : "transform",
        }}
      />
    </div>
  );
}
