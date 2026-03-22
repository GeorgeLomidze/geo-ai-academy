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

type AmbientMote = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  color: RgbColor;
  depth: number;
  pulsePhase: number;
  pulseSpeed: number;
};

type DepthNode = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  haloRadius: number;
  haloAlpha: number;
  color: RgbColor;
  depth: number;
  pulsePhase: number;
  pulseSpeed: number;
};

type RgbColor = {
  r: number;
  g: number;
  b: number;
};

const PALETTE: RgbColor[] = [
  { r: 245, g: 166, b: 35 },
  { r: 255, g: 214, b: 10 },
  { r: 224, g: 144, b: 0 },
  { r: 255, g: 241, b: 204 },
];

const BACKGROUND = "rgb(10 10 10 / 0.04)";
const CONNECTION_DISTANCE = 100;
const DEPTH_CONNECTION_DISTANCE = 150;
const INTERACTION_RADIUS = 200;
const DEPTH_LAYER_FRAME_MS = 1000 / 18;
const MAIN_FRAME_MS = 1000 / 30;
const CURSOR_THROTTLE_MS = 50;
const GRID_CELL_SIZE = CONNECTION_DISTANCE;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function rgba(color: RgbColor, alpha: number) {
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
}

function pickParticleCount(width: number, height: number, isMobile: boolean) {
  const area = width * height;

  if (isMobile) {
    return clamp(Math.round(area / 14000), 20, 30);
  }

  return clamp(Math.round(area / 18000), 50, 60);
}

function pickAmbientMoteCount(width: number, height: number, isMobile: boolean) {
  const area = width * height;

  if (isMobile) {
    return clamp(Math.round(area / 22000), 12, 20);
  }

  return clamp(Math.round(area / 30000), 25, 40);
}

function pickDepthNodeCount(width: number, height: number, isMobile: boolean) {
  const area = width * height;

  if (isMobile) {
    return clamp(Math.round(area / 32000), 10, 16);
  }

  return clamp(Math.round(area / 42000), 18, 28);
}

function createParticle(width: number, height: number): Particle {
  const depth = 0.7 + Math.random() * 0.9;
  const speed = (0.16 + Math.random() * 0.2) * depth;
  const angle = Math.random() * Math.PI * 2;
  const isTiny = Math.random() < 0.72;
  const radius = isTiny
    ? 1 + Math.random() * 1.4
    : 2.6 + Math.random() * 2.1;
  const isBright = Math.random() < 0.24;
  const baseAlpha = isBright
    ? 0.84 + Math.random() * 0.16
    : 0.28 + Math.random() * 0.34;
  const color =
    PALETTE[
      Math.min(
        PALETTE.length - 1,
        Math.floor(Math.random() * PALETTE.length + (isBright ? 0.2 : 0)),
      )
    ];

  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius,
    baseAlpha,
    color,
    depth,
    interactionX: 0,
    interactionY: 0,
    pulsePhase: Math.random() * Math.PI * 2,
    pulseSpeed: 0.0011 + Math.random() * 0.0019,
    sparkTimer: 0,
    sparkDuration: 0,
    sparkStrength: 0,
  };
}

function createAmbientMote(width: number, height: number): AmbientMote {
  const depth = 0.45 + Math.random() * 0.75;
  const angle = Math.random() * Math.PI * 2;
  const speed = 0.02 + Math.random() * 0.08;
  const color = PALETTE[Math.random() < 0.82 ? 0 : 3];

  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: Math.cos(angle) * speed * depth,
    vy: Math.sin(angle) * speed * depth,
    radius: 0.6 + Math.random() * 1.1,
    alpha: 0.035 + Math.random() * 0.08,
    color,
    depth,
    pulsePhase: Math.random() * Math.PI * 2,
    pulseSpeed: 0.00045 + Math.random() * 0.00065,
  };
}

function createDepthNode(width: number, height: number): DepthNode {
  const depth = 0.4 + Math.random() * 0.6;
  const angle = Math.random() * Math.PI * 2;
  const speed = 0.015 + Math.random() * 0.045;
  const useHighlight = Math.random() < 0.18;
  const color = useHighlight ? PALETTE[3] : PALETTE[Math.random() < 0.68 ? 0 : 1];

  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: Math.cos(angle) * speed * depth,
    vy: Math.sin(angle) * speed * depth,
    radius: 1 + Math.random() * 1.9,
    alpha: 0.09 + Math.random() * 0.08,
    haloRadius: 20 + Math.random() * 34,
    haloAlpha: 0.022 + Math.random() * 0.04,
    color,
    depth,
    pulsePhase: Math.random() * Math.PI * 2,
    pulseSpeed: 0.00032 + Math.random() * 0.00055,
  };
}

/** Spatial hash grid for O(n) connection lookups instead of O(n^2) */
function buildSpatialGrid(
  positions: Array<{ x: number; y: number }>,
  cellSize: number,
  gridCols: number,
) {
  const grid = new Map<number, number[]>();

  for (let i = 0; i < positions.length; i++) {
    const col = Math.floor(positions[i].x / cellSize);
    const row = Math.floor(positions[i].y / cellSize);
    const key = row * gridCols + col;
    const cell = grid.get(key);

    if (cell) {
      cell.push(i);
    } else {
      grid.set(key, [i]);
    }
  }

  return grid;
}

export function ParticleNetwork({ className }: ParticleNetworkProps) {
  const reduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;

    if (!container || !canvas) {
      return;
    }

    const host = container;
    const surface = canvas;

    const context = surface.getContext("2d", {
      alpha: true,
      desynchronized: true,
    });

    if (!context) {
      return;
    }

    const ctx = context;

    const mobileMediaQuery = window.matchMedia("(max-width: 767px)");
    const cursor = { x: 0, y: 0, active: false };
    let animationFrameId = 0;
    let resizeObserver: ResizeObserver | null = null;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let particles: Particle[] = [];
    let ambientMotes: AmbientMote[] = [];
    let depthNodes: DepthNode[] = [];
    let lastFrameTimestamp = 0;
    let lastDepthLayerTimestamp = 0;
    let isVisible = false;
    let hasBeenVisible = false;
    let intersectionObserver: IntersectionObserver | null = null;
    let lastCursorUpdate = 0;
    const depthCanvas = document.createElement("canvas");
    const depthContext = depthCanvas.getContext("2d", {
      alpha: true,
      desynchronized: true,
    });

    if (!depthContext) {
      return;
    }

    const depthCtx = depthContext;

    function resizeCanvas() {
      const rect = host.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      // Mobile: 1x resolution. Desktop: capped at 1.5x
      dpr = mobileMediaQuery.matches
        ? 1
        : Math.min(window.devicePixelRatio || 1, 1.5);

      surface.width = Math.round(width * dpr);
      surface.height = Math.round(height * dpr);
      surface.style.width = `${width}px`;
      surface.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      depthCanvas.width = Math.round(width * dpr);
      depthCanvas.height = Math.round(height * dpr);
      depthCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lastDepthLayerTimestamp = 0;

      const particleCount = pickParticleCount(
        width,
        height,
        mobileMediaQuery.matches,
      );

      particles = Array.from({ length: particleCount }, () =>
        createParticle(width, height),
      );
      ambientMotes = Array.from(
        {
          length: pickAmbientMoteCount(width, height, mobileMediaQuery.matches),
        },
        () => createAmbientMote(width, height),
      );
      depthNodes = Array.from(
        { length: pickDepthNodeCount(width, height, mobileMediaQuery.matches) },
        () => createDepthNode(width, height),
      );
    }

    function updateCursor(event: PointerEvent) {
      const now = performance.now();

      if (now - lastCursorUpdate < CURSOR_THROTTLE_MS) {
        return;
      }

      lastCursorUpdate = now;
      const rect = host.getBoundingClientRect();
      const inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;

      if (!inside) {
        cursor.active = false;
        return;
      }

      cursor.x = event.clientX - rect.left;
      cursor.y = event.clientY - rect.top;
      cursor.active = true;
    }

    function resetCursor() {
      cursor.active = false;
    }

    function handleMobileChange() {
      resizeCanvas();
      drawFrame(lastFrameTimestamp);
    }

    function drawParticle(
      particle: Particle,
      drawX: number,
      drawY: number,
      timestamp: number,
      cursorBoost: number,
    ) {
      const pulseValue =
        0.84 +
        0.16 * Math.sin(timestamp * particle.pulseSpeed + particle.pulsePhase);
      const sparkProgress =
        particle.sparkTimer > 0 && particle.sparkDuration > 0
          ? Math.sin(
              ((particle.sparkDuration - particle.sparkTimer) /
                particle.sparkDuration) *
                Math.PI,
            ) * particle.sparkStrength
          : 0;
      const alpha = clamp(
        particle.baseAlpha * pulseValue + cursorBoost + sparkProgress,
        0.15,
        1,
      );

      ctx.beginPath();
      ctx.arc(drawX, drawY, particle.radius, 0, Math.PI * 2);
      ctx.fillStyle = rgba(particle.color, alpha);
      ctx.fill();
    }

    function drawConnections(positions: Array<{ x: number; y: number }>) {
      const gridCols = Math.ceil(width / GRID_CELL_SIZE) + 1;
      const grid = buildSpatialGrid(positions, GRID_CELL_SIZE, gridCols);

      for (let index = 0; index < particles.length; index++) {
        const source = particles[index];
        const sourcePosition = positions[index];
        const col = Math.floor(sourcePosition.x / GRID_CELL_SIZE);
        const row = Math.floor(sourcePosition.y / GRID_CELL_SIZE);

        // Check only neighboring cells (3x3 grid around source)
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const neighborKey = (row + dr) * gridCols + (col + dc);
            const cell = grid.get(neighborKey);

            if (!cell) continue;

            for (const comparisonIndex of cell) {
              if (comparisonIndex <= index) continue;

              const target = particles[comparisonIndex];
              const targetPosition = positions[comparisonIndex];
              const deltaX = sourcePosition.x - targetPosition.x;
              const deltaY = sourcePosition.y - targetPosition.y;
              const distSq = deltaX * deltaX + deltaY * deltaY;

              if (distSq > CONNECTION_DISTANCE * CONNECTION_DISTANCE) {
                continue;
              }

              const distance = Math.sqrt(distSq);
              const distanceFade = 1 - distance / CONNECTION_DISTANCE;
              let alpha =
                distanceFade * distanceFade * (0.11 + (source.depth + target.depth) * 0.05);

              if (cursor.active) {
                const sdx = sourcePosition.x - cursor.x;
                const sdy = sourcePosition.y - cursor.y;
                const tdx = targetPosition.x - cursor.x;
                const tdy = targetPosition.y - cursor.y;
                const sourceDistance = Math.sqrt(sdx * sdx + sdy * sdy);
                const targetDistance = Math.sqrt(tdx * tdx + tdy * tdy);
                const cursorInfluence =
                  Math.max(0, 1 - sourceDistance / INTERACTION_RADIUS) * 0.14 +
                  Math.max(0, 1 - targetDistance / INTERACTION_RADIUS) * 0.14;

                alpha += cursorInfluence;
              }

              ctx.beginPath();
              ctx.moveTo(sourcePosition.x, sourcePosition.y);
              ctx.lineTo(targetPosition.x, targetPosition.y);
              ctx.lineWidth = 0.55 + ((source.depth + target.depth) * 0.2);
              ctx.strokeStyle = rgba(PALETTE[0], clamp(alpha, 0.08, 0.34));
              ctx.stroke();
            }
          }
        }
      }
    }

    function drawAmbientMotes(timestamp: number) {
      for (const mote of ambientMotes) {
        if (!reduceMotion) {
          mote.x += mote.vx;
          mote.y += mote.vy;

          if (mote.x < -18) {
            mote.x = width + 18;
          } else if (mote.x > width + 18) {
            mote.x = -18;
          }

          if (mote.y < -18) {
            mote.y = height + 18;
          } else if (mote.y > height + 18) {
            mote.y = -18;
          }
        }

        const pulse =
          0.88 +
          0.12 * Math.sin(timestamp * mote.pulseSpeed + mote.pulsePhase);

        ctx.beginPath();
        ctx.arc(mote.x, mote.y, mote.radius, 0, Math.PI * 2);
        ctx.fillStyle = rgba(mote.color, clamp(mote.alpha * pulse, 0.03, 0.14));
        ctx.fill();
      }
    }

    function renderDepthFieldLayer(timestamp: number) {
      depthCtx.clearRect(0, 0, width, height);
      const positions = depthNodes.map((node) => {
        if (!reduceMotion) {
          node.x += node.vx;
          node.y += node.vy;

          if (node.x < -32) {
            node.x = width + 32;
          } else if (node.x > width + 32) {
            node.x = -32;
          }

          if (node.y < -32) {
            node.y = height + 32;
          } else if (node.y > height + 32) {
            node.y = -32;
          }
        }

        const pulse =
          0.88 +
          0.12 * Math.sin(timestamp * node.pulseSpeed + node.pulsePhase);

        return {
          x: node.x,
          y: node.y,
          pulse,
        };
      });

      positions.forEach((position, index) => {
        const node = depthNodes[index];
        const haloGradient = depthCtx.createRadialGradient(
          position.x,
          position.y,
          0,
          position.x,
          position.y,
          node.haloRadius,
        );

        haloGradient.addColorStop(
          0,
          rgba(node.color, clamp(node.haloAlpha * position.pulse * 1.4, 0.02, 0.08)),
        );
        haloGradient.addColorStop(
          0.4,
          rgba(node.color, clamp(node.haloAlpha * position.pulse * 0.55, 0.01, 0.04)),
        );
        haloGradient.addColorStop(1, rgba(node.color, 0));

        depthCtx.beginPath();
        depthCtx.fillStyle = haloGradient;
        depthCtx.arc(position.x, position.y, node.haloRadius, 0, Math.PI * 2);
        depthCtx.fill();
      });

      depthCtx.lineCap = "round";

      for (let index = 0; index < depthNodes.length; index += 1) {
        const source = depthNodes[index];
        const sourcePosition = positions[index];

        for (
          let comparisonIndex = index + 1;
          comparisonIndex < depthNodes.length;
          comparisonIndex += 1
        ) {
          const target = depthNodes[comparisonIndex];
          const targetPosition = positions[comparisonIndex];
          const deltaX = sourcePosition.x - targetPosition.x;
          const deltaY = sourcePosition.y - targetPosition.y;
          const distSq = deltaX * deltaX + deltaY * deltaY;

          if (distSq > DEPTH_CONNECTION_DISTANCE * DEPTH_CONNECTION_DISTANCE) {
            continue;
          }

          const distance = Math.sqrt(distSq);
          const fade = 1 - distance / DEPTH_CONNECTION_DISTANCE;
          const lineAlpha =
            fade * fade * (0.05 + (source.depth + target.depth) * 0.03);
          const lineColor = source.color;

          depthCtx.beginPath();
          depthCtx.moveTo(sourcePosition.x, sourcePosition.y);
          depthCtx.lineTo(targetPosition.x, targetPosition.y);
          depthCtx.lineWidth = 1.6 + ((source.depth + target.depth) * 0.55);
          depthCtx.strokeStyle = rgba(
            lineColor,
            clamp(lineAlpha * 0.34, 0.015, 0.06),
          );
          depthCtx.stroke();
        }
      }

      positions.forEach((position, index) => {
        const node = depthNodes[index];
        const alpha = clamp(node.alpha * position.pulse, 0.05, 0.16);

        depthCtx.beginPath();
        depthCtx.arc(position.x, position.y, node.radius, 0, Math.PI * 2);
        depthCtx.fillStyle = rgba(node.color, alpha);
        depthCtx.fill();
      });
    }

    function drawFrame(timestamp: number) {
      if (!width || !height) {
        return;
      }

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = BACKGROUND;
      ctx.fillRect(0, 0, width, height);

      if (
        lastDepthLayerTimestamp === 0 ||
        reduceMotion ||
        timestamp - lastDepthLayerTimestamp >= DEPTH_LAYER_FRAME_MS
      ) {
        renderDepthFieldLayer(timestamp);
        lastDepthLayerTimestamp = timestamp;
      }

      ctx.drawImage(depthCanvas, 0, 0, width, height);
      drawAmbientMotes(timestamp);

      const positions = particles.map((particle) => {
        let cursorBoost = 0;

        if (!reduceMotion) {
          particle.x += particle.vx;
          particle.y += particle.vy;

          if (particle.x < -12) {
            particle.x = width + 12;
          } else if (particle.x > width + 12) {
            particle.x = -12;
          }

          if (particle.y < -12) {
            particle.y = height + 12;
          } else if (particle.y > height + 12) {
            particle.y = -12;
          }

          if (particle.sparkTimer <= 0 && Math.random() < 0.0018) {
            particle.sparkDuration = 24 + Math.random() * 42;
            particle.sparkTimer = particle.sparkDuration;
            particle.sparkStrength = 0.1 + Math.random() * 0.18;
          } else if (particle.sparkTimer > 0) {
            particle.sparkTimer = Math.max(0, particle.sparkTimer - 1);
          }
        }

        let targetInteractionX = 0;
        let targetInteractionY = 0;

        if (cursor.active && !reduceMotion) {
          const deltaX = cursor.x - particle.x;
          const deltaY = cursor.y - particle.y;
          const distSq = deltaX * deltaX + deltaY * deltaY;

          if (distSq < INTERACTION_RADIUS * INTERACTION_RADIUS && distSq > 0.001) {
            const distance = Math.sqrt(distSq);
            const influence = Math.pow(1 - distance / INTERACTION_RADIUS, 1.8);
            const shift = (10 + particle.depth * 7) * influence;

            targetInteractionX = (deltaX / distance) * shift;
            targetInteractionY = (deltaY / distance) * shift;
            cursorBoost = 0.06 + influence * 0.18;
          }
        }

        particle.interactionX +=
          (targetInteractionX - particle.interactionX) * (reduceMotion ? 1 : 0.08);
        particle.interactionY +=
          (targetInteractionY - particle.interactionY) * (reduceMotion ? 1 : 0.08);

        const drawX = particle.x + particle.interactionX;
        const drawY = particle.y + particle.interactionY;

        return { x: drawX, y: drawY, cursorBoost };
      });

      drawConnections(positions);

      positions.forEach((position, index) => {
        drawParticle(
          particles[index],
          position.x,
          position.y,
          timestamp,
          position.cursorBoost,
        );
      });

      lastFrameTimestamp = timestamp;
    }

    function animate(timestamp: number) {
      if (!isVisible) {
        // Fully stop requesting frames when off-screen
        return;
      }

      // Frame skip: target ~30fps for canvas
      if (timestamp - lastFrameTimestamp >= MAIN_FRAME_MS) {
        drawFrame(timestamp);
      }

      animationFrameId = window.requestAnimationFrame(animate);
    }

    function startAnimation() {
      if (animationFrameId) return;
      animationFrameId = window.requestAnimationFrame(animate);
    }

    function stopAnimation() {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
        animationFrameId = 0;
      }
    }

    resizeObserver = new ResizeObserver(() => {
      resizeCanvas();

      if (reduceMotion) {
        drawFrame(lastFrameTimestamp);
      }
    });

    resizeObserver.observe(host);
    host.addEventListener("pointermove", updateCursor, { passive: true });
    host.addEventListener("pointerleave", resetCursor);
    mobileMediaQuery.addEventListener("change", handleMobileChange);

    // IntersectionObserver: lazy start + pause when off-screen
    intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        const nowVisible = entry?.isIntersecting ?? false;
        isVisible = nowVisible;

        if (nowVisible && !hasBeenVisible) {
          hasBeenVisible = true;
          resizeCanvas();

          if (reduceMotion) {
            drawFrame(performance.now());
          } else {
            startAnimation();
          }
        } else if (nowVisible && !reduceMotion) {
          startAnimation();
        } else if (!nowVisible) {
          stopAnimation();
        }
      },
      { threshold: 0.02 },
    );
    intersectionObserver.observe(host);

    return () => {
      stopAnimation();
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      host.removeEventListener("pointermove", updateCursor);
      host.removeEventListener("pointerleave", resetCursor);
      mobileMediaQuery.removeEventListener("change", handleMobileChange);
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
