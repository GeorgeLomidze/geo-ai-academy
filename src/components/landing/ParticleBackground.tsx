"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { ISourceOptions } from "@tsparticles/engine";

const Particles = dynamic(() => import("@tsparticles/react").then((m) => m.Particles), {
  ssr: false,
});

function isChrome(): boolean {
  const ua = navigator.userAgent;
  return ua.includes("Chrome") && !ua.includes("Edg") && !ua.includes("OPR");
}

function resolveParticleCount(isMobile: boolean): number {
  if (isMobile) return 20;
  if (isChrome() && window.devicePixelRatio > 1) return 25;
  return 40;
}

function buildOptions(particleCount: number): ISourceOptions {
  return {
    fullScreen: false,
    fpsLimit: 24,
    detectRetina: false,
    smooth: true,
    particles: {
      number: {
        value: particleCount,
        density: {
          enable: true,
          width: 1200,
          height: 1200,
        },
      },
      color: {
        value: "#F5A623",
      },
      shape: {
        type: "circle",
      },
      opacity: {
        value: { min: 0.1, max: 0.5 },
        animation: {
          enable: false,
        },
      },
      size: {
        value: { min: 1, max: 3 },
        animation: {
          enable: false,
        },
      },
      links: {
        enable: true,
        distance: 120,
        color: "#F5A623",
        opacity: 0.1,
        width: 0.5,
      },
      move: {
        enable: true,
        speed: 0.5,
        direction: "none",
        random: false,
        straight: false,
        outModes: {
          default: "out",
        },
      },
    },
    interactivity: {
      detectsOn: "window",
      events: {
        onHover: {
          enable: true,
          mode: "grab",
        },
        onClick: {
          enable: false,
        },
        resize: { enable: true },
      },
      modes: {
        grab: {
          distance: 150,
          links: {
            opacity: 0.5,
          },
        },
      },
    },
    background: {
      color: "transparent",
    },
  };
}

export function ParticleBackground() {
  const [engineReady, setEngineReady] = useState(false);
  const [options, setOptions] = useState<ISourceOptions | null>(null);

  useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 767px)");

    function resolveOptions() {
      return buildOptions(resolveParticleCount(mobileQuery.matches));
    }

    setOptions(resolveOptions());

    function handleChange() {
      setOptions(resolveOptions());
    }

    mobileQuery.addEventListener("change", handleChange);

    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setEngineReady(true);
    });

    return () => {
      mobileQuery.removeEventListener("change", handleChange);
    };
  }, []);

  // Apply canvas CSS optimizations after tsParticles mounts the canvas
  useEffect(() => {
    if (!engineReady) return;
    const canvas = document.querySelector<HTMLCanvasElement>("#hero-particles canvas");
    if (canvas) {
      canvas.style.imageRendering = "pixelated";
      canvas.style.willChange = "transform";
    }
  }, [engineReady]);

  if (!engineReady || !options) return null;

  return (
    <Particles
      id="hero-particles"
      options={options}
      className="absolute inset-0 size-full"
    />
  );
}
