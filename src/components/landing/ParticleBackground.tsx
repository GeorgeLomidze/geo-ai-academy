"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { ISourceOptions } from "@tsparticles/engine";

const Particles = dynamic(() => import("@tsparticles/react").then((m) => m.Particles), {
  ssr: false,
});

function buildOptions(particleCount: number): ISourceOptions {
  return {
    fullScreen: false,
    fpsLimit: 30,
    detectRetina: true,
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
          enable: true,
          speed: 1,
          sync: false,
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
        opacity: 0.15,
        width: 1,
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

const DESKTOP_OPTIONS = buildOptions(60);
const MOBILE_OPTIONS = buildOptions(25);

export function ParticleBackground() {
  const [engineReady, setEngineReady] = useState(false);
  const [options, setOptions] = useState<ISourceOptions>(DESKTOP_OPTIONS);

  useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 767px)");

    function resolveOptions() {
      return mobileQuery.matches ? MOBILE_OPTIONS : DESKTOP_OPTIONS;
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

  if (!engineReady) return null;

  return (
    <Particles
      id="hero-particles"
      options={options}
      className="absolute inset-0 size-full"
    />
  );
}
