import type { Config } from "tailwindcss";

const config = {
  theme: {
    extend: {
      colors: {
        brand: {
          background: "#0A0A0A",
          surface: "#141414",
          "surface-light": "#1E1E1E",
          border: "#2A2A2A",
          primary: "#FFD60A",
          "primary-hover": "#E6C009",
          "primary-light": "rgb(255 214 10 / 0.1)",
          accent: "#FFD60A",
          "accent-hover": "#E6C009",
          secondary: "#FFFFFF",
          muted: "#8A8A8A",
          "muted-light": "#6A6A6A",
          danger: "#FF4444",
          success: "#22C55E",
          warning: "#F59E0B",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)"],
        display: ["var(--font-space-grotesk)"],
      },
    },
  },
} satisfies Config;

export default config;
