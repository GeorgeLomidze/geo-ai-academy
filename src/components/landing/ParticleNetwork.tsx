"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type ParticleNetworkProps = { className?: string };

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  alpha: number;
  depth: number;
  ix: number;
  iy: number;
};

/* ── Tuning ── */
const LINK_DIST = 120;
const LINK_DIST_SQ = LINK_DIST * LINK_DIST;
const CURSOR_R = 210;
const CURSOR_R_SQ = CURSOR_R * CURSOR_R;
const FRAME_MS = 1000 / 30;
const CURSOR_THROTTLE = 40;
const GRID = LINK_DIST;

function clamp(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v;
}

function pCount(w: number, h: number, mobile: boolean) {
  const a = w * h;
  return mobile
    ? clamp(Math.round(a / 9000), 30, 50)
    : clamp(Math.round(a / 8000), 90, 150);
}

function spawn(w: number, h: number): Particle {
  const depth = 0.3 + Math.random() * 0.7;
  const spd = (0.06 + Math.random() * 0.15) * depth;
  const ang = Math.random() * Math.PI * 2;
  const tier = Math.random();

  /* Clean dot sizing — small crisp dots, some larger nodes */
  const r = tier < 0.5
    ? 1.0 + Math.random() * 0.5
    : tier < 0.85
      ? 1.5 + Math.random() * 0.8
      : 2.2 + Math.random() * 1.0;

  const bright = Math.random() < 0.22;
  const alpha = bright
    ? 0.7 + Math.random() * 0.3
    : 0.3 + Math.random() * 0.4;

  return {
    x: Math.random() * w,
    y: Math.random() * h,
    vx: Math.cos(ang) * spd,
    vy: Math.sin(ang) * spd,
    r, alpha, depth,
    ix: 0, iy: 0,
  };
}

/* Spatial grid */
function buildGrid(parts: Particle[], cols: number) {
  const m = new Map<number, number[]>();
  for (let i = 0; i < parts.length; i++) {
    const k = Math.floor(parts[i].y / GRID) * cols + Math.floor(parts[i].x / GRID);
    const c = m.get(k);
    if (c) c.push(i); else m.set(k, [i]);
  }
  return m;
}

export function ParticleNetwork({ className }: ParticleNetworkProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const cvRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!boxRef.current || !cvRef.current) return;
    const host: HTMLDivElement = boxRef.current;
    const canvas: HTMLCanvasElement = cvRef.current;
    const ctxM = canvas.getContext("2d", { alpha: true, desynchronized: true });
    if (!ctxM) return;
    const ctx: CanvasRenderingContext2D = ctxM;

    const mqMob = window.matchMedia("(max-width: 767px)");
    const mqMot = window.matchMedia("(prefers-reduced-motion: reduce)");
    const cur = { x: 0, y: 0, on: false };
    let w = 0, h = 0, dpr = 1;
    let pts: Particle[] = [];
    let raf = 0, lastT = 0, lastC = 0;
    let vis = false, init = false;

    function resize() {
      const r = host.getBoundingClientRect();
      w = Math.max(1, r.width); h = Math.max(1, r.height);
      dpr = mqMob.matches ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      pts = Array.from({ length: pCount(w, h, mqMob.matches) }, () => spawn(w, h));
    }

    function onMove(e: PointerEvent) {
      const now = performance.now();
      if (now - lastC < CURSOR_THROTTLE) return;
      lastC = now;
      const r = host.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) {
        cur.on = false; return;
      }
      cur.x = e.clientX - r.left;
      cur.y = e.clientY - r.top;
      cur.on = true;
    }
    function onLeave() { cur.on = false; }

    function draw(ts: number) {
      if (!w || !h) return;
      ctx.clearRect(0, 0, w, h);

      const red = mqMot.matches;
      const n = pts.length;
      const gCols = Math.ceil(w / GRID) + 1;

      /* Move */
      if (!red) {
        for (const p of pts) {
          p.x += p.vx; p.y += p.vy;
          if (p.x < -12) p.x = w + 12; else if (p.x > w + 12) p.x = -12;
          if (p.y < -12) p.y = h + 12; else if (p.y > h + 12) p.y = -12;
        }
      }

      /* Cursor interaction */
      const px = new Float32Array(n);
      const py = new Float32Array(n);
      const bst = new Float32Array(n);

      for (let i = 0; i < n; i++) {
        const p = pts[i];
        let tx = 0, ty = 0, b = 0;

        if (cur.on && !red) {
          const ex = cur.x - p.x, ey = cur.y - p.y;
          const dSq = ex * ex + ey * ey;
          if (dSq < CURSOR_R_SQ && dSq > 1) {
            const d = Math.sqrt(dSq);
            const t = 1 - d / CURSOR_R;
            const pull = t * t * (3 - 2 * t);
            const shift = (22 + p.depth * 16) * pull;
            tx = (ex / d) * shift;
            ty = (ey / d) * shift;
            b = pull;
          }
        }

        const lr = red ? 1 : 0.1;
        p.ix += (tx - p.ix) * lr;
        p.iy += (ty - p.iy) * lr;
        px[i] = p.x + p.ix;
        py[i] = p.y + p.iy;
        bst[i] = b;
      }

      /* ── Lines — batched into opacity buckets ── */
      const g = buildGrid(pts, gCols);

      /*
       * 5 buckets with higher base opacities for crisp visible lines.
       * Reference image shows clearly visible connections — not faint.
       */
      const buckets: Array<{ ax: number; ay: number; bx: number; by: number; lw: number }[]> =
        [[], [], [], [], []];
      const bucketA = [0.08, 0.16, 0.28, 0.42, 0.58];

      for (let i = 0; i < n; i++) {
        const ax = px[i], ay = py[i];
        const col = Math.floor(pts[i].x / GRID);
        const row = Math.floor(pts[i].y / GRID);

        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const cell = g.get((row + dr) * gCols + (col + dc));
            if (!cell) continue;
            for (const j of cell) {
              if (j <= i) continue;
              const bx = px[j], by = py[j];
              const ex = ax - bx, ey = ay - by;
              const dSq = ex * ex + ey * ey;
              if (dSq > LINK_DIST_SQ) continue;

              const dist = Math.sqrt(dSq);
              const fade = 1 - dist / LINK_DIST;
              const cb = (bst[i] + bst[j]) * 0.5;

              /* Higher base alpha → clearly visible lines */
              const rawA = fade * fade * (0.15 + (pts[i].depth + pts[j].depth) * 0.08) + cb * 0.4;
              const lw = 0.4 + fade * 0.6 + cb * 1.0;

              const bi = rawA < 0.10 ? 0 : rawA < 0.18 ? 1 : rawA < 0.30 ? 2 : rawA < 0.45 ? 3 : 4;
              buckets[bi].push({ ax, ay, bx, by, lw });
            }
          }
        }
      }

      /* Draw lines — amber/gold color from site palette */
      ctx.lineCap = "round";
      for (let bi = 0; bi < 5; bi++) {
        const lines = buckets[bi];
        if (!lines.length) continue;

        ctx.strokeStyle = `rgba(245,166,35,${bucketA[bi]})`;

        /* Sub-batch by rounded lineWidth */
        const byW = new Map<number, typeof lines>();
        for (const l of lines) {
          const wk = Math.round(l.lw * 3);
          const arr = byW.get(wk);
          if (arr) arr.push(l); else byW.set(wk, [l]);
        }

        for (const [wk, segs] of byW) {
          ctx.lineWidth = wk / 3;
          ctx.beginPath();
          for (const s of segs) {
            ctx.moveTo(s.ax, s.ay);
            ctx.lineTo(s.bx, s.by);
          }
          ctx.stroke();
        }
      }

      /* ── Particles — clean crisp dots, no blurry glow ── */
      for (let i = 0; i < n; i++) {
        const p = pts[i];
        const x = px[i], y = py[i];
        const b = bst[i];

        /* Subtle warm halo — tight, not blurry (no sprite, just a slightly
           larger semi-transparent circle underneath) */
        const haloR = (p.r + b * 2) * 2.5;
        const haloA = clamp((p.alpha * 0.2 + b * 0.3) * p.depth, 0.03, 0.25);
        ctx.beginPath();
        ctx.arc(x, y, haloR, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245,166,35,${haloA})`;
        ctx.fill();

        /* Bright core dot — white with amber tint */
        const coreA = clamp(p.alpha + b * 0.5, 0.4, 1);
        const coreR = p.r + b * 1.4;
        ctx.beginPath();
        ctx.arc(x, y, coreR, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,248,230,${coreA})`;
        ctx.fill();
      }

      /* ── Cursor ambient glow ── */
      if (cur.on) {
        const cg = ctx.createRadialGradient(cur.x, cur.y, 0, cur.x, cur.y, CURSOR_R * 0.7);
        cg.addColorStop(0, "rgba(245,166,35,0.10)");
        cg.addColorStop(0.5, "rgba(245,166,35,0.03)");
        cg.addColorStop(1, "rgba(245,166,35,0)");
        ctx.fillStyle = cg;
        ctx.beginPath();
        ctx.arc(cur.x, cur.y, CURSOR_R * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }

      lastT = ts;
    }

    function tick(ts: number) {
      if (!vis) return;
      if (ts - lastT >= FRAME_MS) draw(ts);
      raf = requestAnimationFrame(tick);
    }
    function start() { if (!raf) raf = requestAnimationFrame(tick); }
    function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }

    const ro = new ResizeObserver(() => { resize(); if (mqMot.matches) draw(lastT); });
    ro.observe(host);
    host.addEventListener("pointermove", onMove, { passive: true });
    host.addEventListener("pointerleave", onLeave);

    const io = new IntersectionObserver(
      ([e]) => {
        vis = e?.isIntersecting ?? false;
        if (vis && !init) { init = true; resize(); if (mqMot.matches) draw(performance.now()); else start(); }
        else if (vis) start();
        else stop();
      },
      { threshold: 0.02 },
    );
    io.observe(host);

    const onMq = () => { resize(); draw(lastT); };
    mqMob.addEventListener("change", onMq);

    return () => {
      stop(); ro.disconnect(); io.disconnect();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      mqMob.removeEventListener("change", onMq);
    };
  }, []);

  return (
    <div
      ref={boxRef}
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <canvas
        ref={cvRef}
        className="size-full"
        style={{ contain: "layout paint size", transform: "translateZ(0)" }}
      />
    </div>
  );
}
