"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type ParticleNetworkProps = {
  className?: string;
};

type PaletteEntry = {
  fill: string;
  rgb: [number, number, number];
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseSize: number;
  size: number;
  baseOpacity: number;
  opacity: number;
  offsetX: number;
  offsetY: number;
  targetOffsetX: number;
  targetOffsetY: number;
  pulsePhase: number;
  pulseSpeed: number;
  depth: number;
  palette: PaletteEntry;
  sparkle: boolean;
};

const MOBILE_BREAKPOINT = 768;
const DESKTOP_PARTICLE_COUNT = 96;
const MOBILE_PARTICLE_COUNT = 52;
const CONNECTION_DISTANCE = 150;
const CURSOR_RADIUS = 200;
const MAX_CURSOR_SHIFT = 18;
const WRAP_MARGIN = 24;
const DPR_LIMIT = 2;
const PALETTE: PaletteEntry[] = [
  { fill: "#F5A623", rgb: [245, 166, 35] },
  { fill: "#FFD60A", rgb: [255, 214, 10] },
  { fill: "#E09000", rgb: [224, 144, 0] },
  { fill: "#FFF1CC", rgb: [255, 241, 204] },
];

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function pickPaletteEntry() {
  const roll = Math.random();

  if (roll < 0.48) return PALETTE[0];
  if (roll < 0.74) return PALETTE[1];
  if (roll < 0.96) return PALETTE[2];

  return PALETTE[3];
}

function createParticle(width: number, height: number): Particle {
  const depth = Math.random();
  const angle = Math.random() * Math.PI * 2;
  const palette = pickPaletteEntry();

  let baseSize = randomBetween(1.2, 2.4);
  let baseOpacity = randomBetween(0.2, 0.45);
  let speed = randomBetween(0.12, 0.2);

  if (depth > 0.38) {
    baseSize = randomBetween(1.8, 3.3);
    baseOpacity = randomBetween(0.28, 0.62);
    speed = randomBetween(0.18, 0.34);
  }

  if (depth > 0.74) {
    baseSize = randomBetween(3.1, 5);
    baseOpacity = randomBetween(0.62, 0.96);
    speed = randomBetween(0.26, 0.46);
  }

  const sparkle = palette.fill === "#FFF1CC";
  const velocityScale = sparkle ? 1.08 : 1;

  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: Math.cos(angle) * speed * velocityScale,
    vy: Math.sin(angle) * speed * velocityScale,
    baseSize,
    size: baseSize,
    baseOpacity,
    opacity: baseOpacity,
    offsetX: 0,
    offsetY: 0,
    targetOffsetX: 0,
    targetOffsetY: 0,
    pulsePhase: Math.random() * Math.PI * 2,
    pulseSpeed: randomBetween(0.0015, 0.0038),
    depth,
    palette,
    sparkle,
  };
}

function createParticles(width: number, height: number, count: number) {
  return Array.from({ length: count }, () => createParticle(width, height));
}

function wrapParticlePosition(particle: Particle, width: number, height: number) {
  if (particle.x < -WRAP_MARGIN) particle.x = width + WRAP_MARGIN;
  if (particle.x > width + WRAP_MARGIN) particle.x = -WRAP_MARGIN;
  if (particle.y < -WRAP_MARGIN) particle.y = height + WRAP_MARGIN;
  if (particle.y > height + WRAP_MARGIN) particle.y = -WRAP_MARGIN;
}

function drawParticle(
  context: CanvasRenderingContext2D,
  particle: Particle,
  x: number,
  y: number,
) {
  const radius = particle.size / 2;
  const [r, g, b] = particle.palette.rgb;

  if (particle.opacity > 0.45 || particle.baseSize > 2.2) {
    context.beginPath();
    context.fillStyle = `rgba(${r}, ${g}, ${b}, ${particle.opacity * 0.12})`;
    context.arc(x, y, radius * (particle.sparkle ? 4.6 : 3.6), 0, Math.PI * 2);
    context.fill();
  }

  context.beginPath();
  context.fillStyle = `rgba(${r}, ${g}, ${b}, ${particle.opacity})`;
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fill();

  if (particle.sparkle) {
    context.beginPath();
    context.fillStyle = `rgba(255, 255, 255, ${Math.min(
      0.85,
      particle.opacity * 0.72,
    )})`;
    context.arc(x, y, Math.max(0.55, radius * 0.42), 0, Math.PI * 2);
    context.fill();
  }
}

export function ParticleNetwork({ className }: ParticleNetworkProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;

    if (!canvas || !container) return;

    const context = canvas.getContext("2d", { alpha: true });

    if (!context) return;

    const resolvedCanvas = canvas as HTMLCanvasElement;
    const resolvedContainer = container as HTMLDivElement;
    const resolvedContext = context as CanvasRenderingContext2D;

    resolvedContext.imageSmoothingEnabled = true;

    const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileQuery = window.matchMedia(
      `(max-width: ${MOBILE_BREAKPOINT - 1}px)`,
    );

    const cursor = { active: false, x: 0, y: 0 };
    let particles: Particle[] = [];
    let frameId = 0;
    let resizeObserver: ResizeObserver | null = null;
    let intersectionObserver: IntersectionObserver | null = null;
    let isVisible = true;
    let width = 1;
    let height = 1;
    let lastTimestamp = 0;

    function getParticleCount() {
      return mobileQuery.matches
        ? MOBILE_PARTICLE_COUNT
        : DESKTOP_PARTICLE_COUNT;
    }

    function resizeCanvas() {
      const rect = resolvedContainer.getBoundingClientRect();
      const nextWidth = Math.max(1, rect.width);
      const nextHeight = Math.max(1, rect.height);
      const dpr = Math.min(window.devicePixelRatio || 1, DPR_LIMIT);

      width = nextWidth;
      height = nextHeight;
      resolvedCanvas.width = Math.round(nextWidth * dpr);
      resolvedCanvas.height = Math.round(nextHeight * dpr);
      resolvedCanvas.style.width = `${nextWidth}px`;
      resolvedCanvas.style.height = `${nextHeight}px`;
      resolvedContext.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = createParticles(nextWidth, nextHeight, getParticleCount());
      drawFrame(0, true);
    }

    function updateParticles(deltaFactor: number, timestamp: number) {
      for (const particle of particles) {
        particle.x += particle.vx * deltaFactor;
        particle.y += particle.vy * deltaFactor;
        wrapParticlePosition(particle, width, height);

        if (cursor.active) {
          const dx = cursor.x - particle.x;
          const dy = cursor.y - particle.y;
          const distance = Math.hypot(dx, dy) || 1;

          if (distance < CURSOR_RADIUS) {
            const influence = 1 - distance / CURSOR_RADIUS;
            const shift =
              MAX_CURSOR_SHIFT * influence * (0.45 + particle.depth * 0.55);

            particle.targetOffsetX = (dx / distance) * shift;
            particle.targetOffsetY = (dy / distance) * shift;
          } else {
            particle.targetOffsetX = 0;
            particle.targetOffsetY = 0;
          }
        } else {
          particle.targetOffsetX = 0;
          particle.targetOffsetY = 0;
        }

        particle.offsetX +=
          (particle.targetOffsetX - particle.offsetX) * 0.08 * deltaFactor;
        particle.offsetY +=
          (particle.targetOffsetY - particle.offsetY) * 0.08 * deltaFactor;

        particle.pulsePhase += particle.pulseSpeed * deltaFactor * 16.67;

        const pulseWave = (Math.sin(particle.pulsePhase) + 1) / 2;
        const pulseBoost =
          pulseWave > 0.985 ? (pulseWave - 0.985) / 0.015 : 0;

        particle.opacity = clamp(
          particle.baseOpacity + pulseBoost * (particle.sparkle ? 0.4 : 0.26),
          0.18,
          1,
        );
        particle.size = particle.baseSize + pulseBoost * (particle.sparkle ? 1 : 0.6);

        if (timestamp > 0 && Math.random() < 0.00018 * deltaFactor) {
          particle.pulsePhase = Math.PI / 2;
        }
      }
    }

    function drawConnections(displayPoints: { particle: Particle; x: number; y: number }[]) {
      for (let index = 0; index < displayPoints.length; index += 1) {
        const first = displayPoints[index];

        for (let secondIndex = index + 1; secondIndex < displayPoints.length; secondIndex += 1) {
          const second = displayPoints[secondIndex];
          const dx = second.x - first.x;

          if (Math.abs(dx) > CONNECTION_DISTANCE) continue;

          const dy = second.y - first.y;

          if (Math.abs(dy) > CONNECTION_DISTANCE) continue;

          const distance = Math.hypot(dx, dy);

          if (distance > CONNECTION_DISTANCE) continue;

          const baseOpacity =
            (1 - distance / CONNECTION_DISTANCE) *
            (0.08 + ((first.particle.depth + second.particle.depth) / 2) * 0.14);

          if (baseOpacity <= 0.02) continue;

          let glowBoost = 0;

          if (cursor.active) {
            const lineMidX = (first.x + second.x) / 2;
            const lineMidY = (first.y + second.y) / 2;
            const cursorDistance = Math.hypot(cursor.x - lineMidX, cursor.y - lineMidY);

            if (cursorDistance < CURSOR_RADIUS) {
              glowBoost = (1 - cursorDistance / CURSOR_RADIUS) * 0.12;
            }
          }

          resolvedContext.beginPath();
          resolvedContext.moveTo(first.x, first.y);
          resolvedContext.lineTo(second.x, second.y);
          resolvedContext.lineWidth =
            0.5 + ((first.particle.depth + second.particle.depth) / 2) * 0.5;
          resolvedContext.strokeStyle = `rgba(245, 166, 35, ${clamp(
            baseOpacity + glowBoost,
            0.05,
            0.32,
          )})`;
          resolvedContext.stroke();
        }
      }
    }

    function drawFrame(timestamp: number, staticFrame = false) {
      resolvedContext.clearRect(0, 0, width, height);

      if (!staticFrame) {
        const deltaMs = lastTimestamp === 0 ? 16.67 : Math.min(33, timestamp - lastTimestamp);
        const deltaFactor = deltaMs / 16.67;

        updateParticles(deltaFactor, timestamp);
        lastTimestamp = timestamp;
      }

      const displayPoints = particles.map((particle) => ({
        particle,
        x: particle.x + particle.offsetX,
        y: particle.y + particle.offsetY,
      }));

      drawConnections(displayPoints);

      for (const point of displayPoints) {
        drawParticle(resolvedContext, point.particle, point.x, point.y);
      }
    }

    function stopAnimation() {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
        frameId = 0;
      }
    }

    function animate(timestamp: number) {
      drawFrame(timestamp);

      if (!reduceMotionQuery.matches && isVisible) {
        frameId = window.requestAnimationFrame(animate);
      } else {
        frameId = 0;
      }
    }

    function startAnimation() {
      stopAnimation();
      lastTimestamp = 0;

      if (reduceMotionQuery.matches || !isVisible) {
        drawFrame(0, true);
        return;
      }

      frameId = window.requestAnimationFrame(animate);
    }

    function handlePointerMove(event: PointerEvent) {
      const rect = resolvedContainer.getBoundingClientRect();
      const nextX = event.clientX - rect.left;
      const nextY = event.clientY - rect.top;
      const withinBounds =
        nextX >= 0 && nextX <= rect.width && nextY >= 0 && nextY <= rect.height;

      cursor.active = withinBounds;
      cursor.x = nextX;
      cursor.y = nextY;
    }

    function handlePointerLeave() {
      cursor.active = false;
    }

    function handleMediaChange() {
      resizeCanvas();
      startAnimation();
    }

    resizeCanvas();
    startAnimation();

    resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
      startAnimation();
    });
    resizeObserver.observe(resolvedContainer);

    intersectionObserver = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        isVisible = entry?.isIntersecting ?? true;

        if (isVisible) {
          startAnimation();
        } else {
          stopAnimation();
        }
      },
      { threshold: 0.05 },
    );
    intersectionObserver.observe(resolvedContainer);

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerleave", handlePointerLeave);
    reduceMotionQuery.addEventListener("change", handleMediaChange);
    mobileQuery.addEventListener("change", handleMediaChange);

    return () => {
      stopAnimation();
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
      reduceMotionQuery.removeEventListener("change", handleMediaChange);
      mobileQuery.removeEventListener("change", handleMediaChange);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,10,10,0.98)_0%,rgba(10,10,10,0.92)_36%,rgba(10,10,10,0.76)_68%,rgba(10,10,10,0.22)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_18%,rgba(245,166,35,0.12)_0%,rgba(245,166,35,0.04)_22%,transparent_54%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_26%,rgba(0,0,0,0.26)_72%,rgba(0,0,0,0.62)_100%)]" />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 size-full"
        style={{ transform: "translateZ(0)", willChange: "transform" }}
      />
    </div>
  );
}
