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
  glowR: number;
  depth: number;
  /** Smoothed interaction offset */
  ix: number;
  iy: number;
  colorIdx: number;
};

/* ── Palette ── */
const PAL = [
  [245, 166, 35],
  [255, 214, 10],
  [224, 144, 0],
  [255, 241, 204],
] as const;

/* ── Tuning ── */
const LINK_DIST = 110;
const LINK_DIST_SQ = LINK_DIST * LINK_DIST;
const CURSOR_R = 200;
const CURSOR_R_SQ = CURSOR_R * CURSOR_R;
const FRAME_MS = 1000 / 30;
const CURSOR_THROTTLE = 40;
const GRID = LINK_DIST;

function clamp(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v;
}

function count(w: number, h: number, mobile: boolean) {
  const a = w * h;
  return mobile
    ? clamp(Math.round(a / 9000), 30, 50)
    : clamp(Math.round(a / 8500), 90, 140);
}

function spawn(w: number, h: number): Particle {
  const depth = 0.3 + Math.random() * 0.7;
  const spd = (0.06 + Math.random() * 0.16) * depth;
  const ang = Math.random() * Math.PI * 2;
  const tier = Math.random();

  const r = tier < 0.45
    ? 0.8 + Math.random() * 0.5          // dust
    : tier < 0.82
      ? 1.2 + Math.random() * 0.8        // node
      : 1.8 + Math.random() * 1.2;       // hub

  const bright = Math.random() < 0.2;
  const alpha = bright
    ? 0.65 + Math.random() * 0.35
    : 0.18 + Math.random() * 0.32;

  const glowR = r * (bright ? 10 : 6) + depth * 6;

  return {
    x: Math.random() * w,
    y: Math.random() * h,
    vx: Math.cos(ang) * spd,
    vy: Math.sin(ang) * spd,
    r, alpha, glowR, depth,
    ix: 0, iy: 0,
    colorIdx: Math.floor(Math.random() * PAL.length),
  };
}

/* Pre-render glow sprite — one drawImage vs expensive shadowBlur */
function makeGlow(size: number, c: readonly number[]) {
  const cv = document.createElement("canvas");
  const s = Math.ceil(size * 2);
  cv.width = s; cv.height = s;
  const g = cv.getContext("2d");
  if (!g) return cv;
  const h = s / 2;
  const gr = g.createRadialGradient(h, h, 0, h, h, h);
  gr.addColorStop(0,    `rgba(${c[0]},${c[1]},${c[2]},0.6)`);
  gr.addColorStop(0.12, `rgba(${c[0]},${c[1]},${c[2]},0.28)`);
  gr.addColorStop(0.4,  `rgba(${c[0]},${c[1]},${c[2]},0.07)`);
  gr.addColorStop(1,    `rgba(${c[0]},${c[1]},${c[2]},0)`);
  g.fillStyle = gr;
  g.fillRect(0, 0, s, s);
  return cv;
}

/* Spatial grid */
function grid(parts: Particle[], cols: number) {
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

    /* Sprites */
    const sprites: HTMLCanvasElement[] = [];
    function buildSprites() {
      sprites.length = 0;
      const sz = 36 * dpr;
      for (const c of PAL) sprites.push(makeGlow(sz, c));
    }

    /* Resize */
    function resize() {
      const r = host.getBoundingClientRect();
      w = Math.max(1, r.width); h = Math.max(1, r.height);
      dpr = mqMob.matches ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildSprites();
      pts = Array.from({ length: count(w, h, mqMob.matches) }, () => spawn(w, h));
    }

    /* Cursor */
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

    /* ── Draw frame ── */
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

      /* Cursor interaction — smooth magnetic pull */
      const dx_ = new Float32Array(n);
      const dy_ = new Float32Array(n);
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
            const pull = t * t * (3 - 2 * t);           // smoothstep
            const shift = (20 + p.depth * 14) * pull;    // stronger pull
            tx = (ex / d) * shift;
            ty = (ey / d) * shift;
            b = pull;
          }
        }

        /* Smooth lerp for organic feel */
        const lr = red ? 1 : 0.1;
        p.ix += (tx - p.ix) * lr;
        p.iy += (ty - p.iy) * lr;

        dx_[i] = p.x + p.ix;
        dy_[i] = p.y + p.iy;
        bst[i] = b;
      }

      /* ── Lines — batched by opacity bucket for fewer stroke() calls ── */
      const g = grid(pts, gCols);

      /* 4 opacity buckets: dim, mid, bright, cursor-hot */
      const buckets: Array<{ ax: number; ay: number; bx: number; by: number; w: number }[]> = [[], [], [], []];
      const bucketAlphas = [0.04, 0.09, 0.18, 0.32];

      for (let i = 0; i < n; i++) {
        const ax = dx_[i], ay = dy_[i];
        const col = Math.floor(pts[i].x / GRID);
        const row = Math.floor(pts[i].y / GRID);

        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const cell = g.get((row + dr) * gCols + (col + dc));
            if (!cell) continue;
            for (const j of cell) {
              if (j <= i) continue;
              const bx = dx_[j], by = dy_[j];
              const ex = ax - bx, ey = ay - by;
              const dSq = ex * ex + ey * ey;
              if (dSq > LINK_DIST_SQ) continue;

              const dist = Math.sqrt(dSq);
              const fade = 1 - dist / LINK_DIST;
              const cb = (bst[i] + bst[j]) * 0.5;
              const rawA = fade * fade * (0.06 + (pts[i].depth + pts[j].depth) * 0.04) + cb * 0.3;
              const lw = 0.3 + fade * 0.5 + cb * 0.8;

              /* Route to bucket */
              const bi = rawA < 0.06 ? 0 : rawA < 0.12 ? 1 : rawA < 0.22 ? 2 : 3;
              buckets[bi].push({ ax, ay, bx, by, w: lw });
            }
          }
        }
      }

      /* Draw each bucket in one stroke() call */
      ctx.lineCap = "round";
      for (let bi = 0; bi < 4; bi++) {
        const lines = buckets[bi];
        if (lines.length === 0) continue;

        ctx.strokeStyle = `rgba(245,166,35,${bucketAlphas[bi]})`;

        /* Group by similar lineWidth (round to 0.3 steps) */
        const byWidth = new Map<number, typeof lines>();
        for (const l of lines) {
          const wk = Math.round(l.w * 3);
          const arr = byWidth.get(wk);
          if (arr) arr.push(l); else byWidth.set(wk, [l]);
        }

        for (const [wk, segs] of byWidth) {
          ctx.lineWidth = wk / 3;
          ctx.beginPath();
          for (const s of segs) {
            ctx.moveTo(s.ax, s.ay);
            ctx.lineTo(s.bx, s.by);
          }
          ctx.stroke();
        }
      }

      /* ── Particles + glow ── */
      for (let i = 0; i < n; i++) {
        const p = pts[i];
        const px = dx_[i], py = dy_[i];
        const b = bst[i];

        /* Glow halo */
        const spr = sprites[p.colorIdx];
        const gs = (p.glowR + b * 16) * 2;
        const ga = clamp(p.alpha * 0.55 + b * 0.45, 0.06, 0.75);
        ctx.globalAlpha = ga;
        ctx.drawImage(spr, px - gs / 2, py - gs / 2, gs, gs);
        ctx.globalAlpha = 1;

        /* White core */
        const ca = clamp(p.alpha + b * 0.5, 0.25, 1);
        const cr = p.r + b * 1.5;
        ctx.beginPath();
        ctx.arc(px, py, cr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${ca})`;
        ctx.fill();
      }

      /* ── Cursor glow ── */
      if (cur.on) {
        const cg = ctx.createRadialGradient(cur.x, cur.y, 0, cur.x, cur.y, CURSOR_R * 0.75);
        cg.addColorStop(0, "rgba(245,166,35,0.09)");
        cg.addColorStop(0.5, "rgba(245,166,35,0.03)");
        cg.addColorStop(1, "rgba(245,166,35,0)");
        ctx.fillStyle = cg;
        ctx.beginPath();
        ctx.arc(cur.x, cur.y, CURSOR_R * 0.75, 0, Math.PI * 2);
        ctx.fill();
      }

      lastT = ts;
    }

    /* ── Loop ── */
    function tick(ts: number) {
      if (!vis) return;
      if (ts - lastT >= FRAME_MS) draw(ts);
      raf = requestAnimationFrame(tick);
    }
    function start() { if (!raf) raf = requestAnimationFrame(tick); }
    function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }

    /* ── Setup ── */
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
