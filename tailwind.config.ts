import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        canvas: {
          base: "#0B0F17",
          deep: "#070A10",
        },
        surface: {
          1: "rgba(17, 24, 39, 0.75)",
          2: "#151D2A",
          3: "#1E293B",
          border: "rgba(255, 255, 255, 0.08)",
        },
        fitness: {
          primary: "#10B981",
          glow: "rgba(16, 185, 129, 0.35)",
          light: "#34D399",
          dark: "#059669",
        },
        healthcare: {
          primary: "#06B6D4",
          accent: "#38BDF8",
          glow: "rgba(6, 182, 212, 0.35)",
        },
        nebula: {
          purple: "#8B5CF6",
          blue: "#3B82F6",
          cyan: "#06B6D4",
        },
        status: {
          warning: "#F59E0B",
          danger: "#EF4444",
          success: "#10B981",
        },
      },
      fontFamily: {
        headline: ["'Space Grotesk'", "sans-serif"],
        body: ["'Plus Jakarta Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      boxShadow: {
        "glow-fitness": "0 0 25px -4px rgba(16, 185, 129, 0.35)",
        "glow-healthcare": "0 0 25px -4px rgba(6, 182, 212, 0.35)",
        "glow-nebula": "0 0 30px -4px rgba(139, 92, 246, 0.4)",
      },
      backgroundImage: {
        "ai-gradient": "linear-gradient(135deg, #8B5CF6 0%, #3B82F6 50%, #06B6D4 100%)",
        "fitness-gradient": "linear-gradient(135deg, #10B981 0%, #059669 100%)",
        "healthcare-gradient": "linear-gradient(135deg, #06B6D4 0%, #0284C7 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
