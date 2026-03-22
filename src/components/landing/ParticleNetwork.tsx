"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type ParticleNetworkProps = { className?: string };

/* ── Types ── */
type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  alpha: number;
  glowR: number;
  depth: number;
};

/* ── Constants ── */
const PALETTE = [
  [245, 166, 35],   // brand gold
  [255, 214, 10],   // bright yellow
  [224, 144, 0],    // deep amber
  [255, 241, 204],  // pale cream
] as const;

const LINK_DIST = 120;
const LINK_DIST_SQ = LINK_DIST * LINK_DIST;
const CURSOR_R = 180;
const CURSOR_R_SQ = CURSOR_R * CURSOR_R;
const FRAME_MS = 1000 / 28;        // ~28 fps cap
const CURSOR_THROTTLE = 48;        // ms between cursor reads
const GRID_SIZE = LINK_DIST;       // spatial hash cell = link distance

/* ── Helpers ── */
function clamp(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v;
}

function particleCount(w: number, h: number, mobile: boolean) {
  const area = w * h;
  return mobile
    ? clamp(Math.round(area / 18000), 16, 24)
    : clamp(Math.round(area / 22000), 38, 52);
}

function makeParticle(w: number, h: number): Particle {
  const depth = 0.4 + Math.random() * 0.6;
  const speed = (0.08 + Math.random() * 0.14) * depth;
  const angle = Math.random() * Math.PI * 2;
  const tier = Math.random();

  /* 3-tier: dust 50% | node 38% | hub 12% */
  const r = tier < 0.5 ? 1.0 + Math.random() * 0.6
          : tier < 0.88 ? 1.6 + Math.random() * 0.8
          : 2.4 + Math.random() * 1.0;

  const bright = Math.random() < 0.15;
  const alpha = bright ? 0.7 + Math.random() * 0.3 : 0.25 + Math.random() * 0.35;

  /* Glow radius scales with brightness + tier */
  const glowR = r * (bright ? 8 : 5) + depth * 4;

  return {
    x: Math.random() * w,
    y: Math.random() * h,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    r, alpha, glowR, depth,
  };
}

/* Pre-render a soft radial glow sprite once → drawImage is 50x faster than shadowBlur */
function createGlowSprite(size: number, color: readonly number[]) {
  const c = document.createElement("canvas");
  const s = Math.ceil(size * 2);
  c.width = s;
  c.height = s;
  const g = c.getContext("2d");
  if (!g) return c;

  const half = s / 2;
  const grad = g.createRadialGradient(half, half, 0, half, half, half);
  grad.addColorStop(0, `rgba(${color[0]},${color[1]},${color[2]},0.55)`);
  grad.addColorStop(0.15, `rgba(${color[0]},${color[1]},${color[2]},0.22)`);
  grad.addColorStop(0.5, `rgba(${color[0]},${color[1]},${color[2]},0.06)`);
  grad.addColorStop(1, `rgba(${color[0]},${color[1]},${color[2]},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, s, s);
  return c;
}

/* Spatial hash grid for O(n) neighbor lookup */
function buildGrid(parts: Particle[], cols: number) {
  const grid = new Map<number, number[]>();
  for (let i = 0; i < parts.length; i++) {
    const key = Math.floor(parts[i].y / GRID_SIZE) * cols + Math.floor(parts[i].x / GRID_SIZE);
    const cell = grid.get(key);
    if (cell) cell.push(i); else grid.set(key, [i]);
  }
  return grid;
}

/* ── Component ── */
export function ParticleNetwork({ className }: ParticleNetworkProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;
    const host: HTMLDivElement = containerRef.current;
    const canvas: HTMLCanvasElement = canvasRef.current;

    const ctxMaybe = canvas.getContext("2d", { alpha: true, desynchronized: true });
    if (!ctxMaybe) return;
    const ctx: CanvasRenderingContext2D = ctxMaybe;

    /* ── State ── */
    const mqMobile = window.matchMedia("(max-width: 767px)");
    const mqMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mouse = { x: 0, y: 0, active: false };
    let w = 0, h = 0, dpr = 1;
    let parts: Particle[] = [];
    let rafId = 0;
    let lastFrame = 0;
    let lastCursor = 0;
    let visible = false;
    let initialized = false;

    /* ── Glow sprites (pre-rendered per palette entry) ── */
    const glowSprites: HTMLCanvasElement[] = [];

    function buildSprites() {
      glowSprites.length = 0;
      const maxGlow = 30 * dpr;
      for (const color of PALETTE) {
        glowSprites.push(createGlowSprite(maxGlow, color));
      }
    }

    /* ── Resize ── */
    function resize() {
      const rect = host.getBoundingClientRect();
      w = Math.max(1, rect.width);
      h = Math.max(1, rect.height);
      dpr = mqMobile.matches ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);

      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      buildSprites();
      parts = Array.from({ length: particleCount(w, h, mqMobile.matches) }, () => makeParticle(w, h));
    }

    /* ── Cursor ── */
    function onMove(e: PointerEvent) {
      const now = performance.now();
      if (now - lastCursor < CURSOR_THROTTLE) return;
      lastCursor = now;

      const r = host.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) {
        mouse.active = false;
        return;
      }
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
      mouse.active = true;
    }

    function onLeave() { mouse.active = false; }

    /* ── Draw ── */
    function draw(ts: number) {
      if (!w || !h) return;

      ctx.clearRect(0, 0, w, h);

      const reduced = mqMotion.matches;
      const gridCols = Math.ceil(w / GRID_SIZE) + 1;

      /* Move particles */
      if (!reduced) {
        for (const p of parts) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < -10) p.x = w + 10;
          else if (p.x > w + 10) p.x = -10;
          if (p.y < -10) p.y = h + 10;
          else if (p.y > h + 10) p.y = -10;
        }
      }

      /* Cursor interaction — push/attract */
      const drawX = new Float32Array(parts.length);
      const drawY = new Float32Array(parts.length);
      const boost = new Float32Array(parts.length);

      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        let ox = 0, oy = 0, b = 0;

        if (mouse.active && !reduced) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const dSq = dx * dx + dy * dy;
          if (dSq < CURSOR_R_SQ && dSq > 1) {
            const d = Math.sqrt(dSq);
            const t = 1 - d / CURSOR_R;
            const pull = t * t;
            ox = (dx / d) * pull * 18;
            oy = (dy / d) * pull * 18;
            b = pull;
          }
        }

        drawX[i] = p.x + ox;
        drawY[i] = p.y + oy;
        boost[i] = b;
      }

      /* ── Connection lines (spatial grid) ── */
      const grid = buildGrid(parts, gridCols);

      ctx.lineCap = "round";

      for (let i = 0; i < parts.length; i++) {
        const ax = drawX[i], ay = drawY[i];
        const col = Math.floor(parts[i].x / GRID_SIZE);
        const row = Math.floor(parts[i].y / GRID_SIZE);

        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const cell = grid.get((row + dr) * gridCols + (col + dc));
            if (!cell) continue;

            for (const j of cell) {
              if (j <= i) continue;
              const bx = drawX[j], by = drawY[j];
              const dx = ax - bx, dy = ay - by;
              const dSq = dx * dx + dy * dy;
              if (dSq > LINK_DIST_SQ) continue;

              const dist = Math.sqrt(dSq);
              const fade = 1 - dist / LINK_DIST;
              const bst = (boost[i] + boost[j]) * 0.5;

              /* Line alpha: base + cursor boost */
              const a = clamp(
                fade * fade * (0.08 + (parts[i].depth + parts[j].depth) * 0.04) + bst * 0.25,
                0.03,
                0.35,
              );

              ctx.beginPath();
              ctx.moveTo(ax, ay);
              ctx.lineTo(bx, by);
              ctx.lineWidth = 0.4 + fade * 0.4 + bst * 0.6;
              ctx.strokeStyle = `rgba(245,166,35,${a})`;
              ctx.stroke();
            }
          }
        }
      }

      /* ── Draw particles + glow ── */
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        const px = drawX[i], py = drawY[i];
        const b = boost[i];

        /* Pick sprite (round-robin by index for color variation) */
        const sprite = glowSprites[i % glowSprites.length];
        const glowScale = (p.glowR + b * 12) * 2;

        /* Glow halo — stamp pre-rendered sprite */
        const glowAlpha = clamp(p.alpha * 0.6 + b * 0.4, 0.08, 0.7);
        ctx.globalAlpha = glowAlpha;
        ctx.drawImage(sprite, px - glowScale / 2, py - glowScale / 2, glowScale, glowScale);
        ctx.globalAlpha = 1;

        /* Core dot */
        const coreAlpha = clamp(p.alpha + b * 0.4, 0.3, 1);
        const coreR = p.r + b * 1.2;
        ctx.beginPath();
        ctx.arc(px, py, coreR, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${coreAlpha})`;
        ctx.fill();
      }

      /* ── Cursor ambient glow ── */
      if (mouse.active) {
        const cg = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, CURSOR_R * 0.7);
        cg.addColorStop(0, "rgba(245,166,35,0.06)");
        cg.addColorStop(1, "rgba(245,166,35,0)");
        ctx.fillStyle = cg;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, CURSOR_R * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }

      lastFrame = ts;
    }

    /* ── Loop ── */
    function tick(ts: number) {
      if (!visible) return;
      if (ts - lastFrame >= FRAME_MS) draw(ts);
      rafId = requestAnimationFrame(tick);
    }
    function start() { if (!rafId) rafId = requestAnimationFrame(tick); }
    function stop() { if (rafId) { cancelAnimationFrame(rafId); rafId = 0; } }

    /* ── Observers ── */
    const ro = new ResizeObserver(() => { resize(); if (mqMotion.matches) draw(lastFrame); });
    ro.observe(host);

    host.addEventListener("pointermove", onMove, { passive: true });
    host.addEventListener("pointerleave", onLeave);

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry?.isIntersecting ?? false;
        if (visible && !initialized) {
          initialized = true;
          resize();
          if (mqMotion.matches) draw(performance.now());
          else start();
        } else if (visible) {
          start();
        } else {
          stop();
        }
      },
      { threshold: 0.02 },
    );
    io.observe(host);

    const onMqChange = () => { resize(); draw(lastFrame); };
    mqMobile.addEventListener("change", onMqChange);

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      mqMobile.removeEventListener("change", onMqChange);
    };
  }, []);

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
        }}
      />
    </div>
  );
}
