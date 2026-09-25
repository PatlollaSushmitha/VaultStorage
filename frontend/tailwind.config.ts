import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          bg: "#0a0c10",
          surface: "#12151b",
          surface2: "#161a22",
          border: "#21252c",
          borderStrong: "#2b303a",
        },
        text: {
          primary: "#eceef1",
          secondary: "#9aa2b1",
          muted: "#6b7280",
        },
        brand: {
          DEFAULT: "#5b8def",
          dim: "#3d5f9e",
          bright: "#7ea6f5",
        },
        status: {
          healthy: "#34d399",
          healthyDim: "#0f2b22",
          warning: "#f59e0b",
          warningDim: "#332309",
          failed: "#f0525c",
          failedDim: "#331416",
          info: "#60a5fa",
          infoDim: "#122236",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgba(0,0,0,0.35)",
        card: "0 4px 16px -4px rgba(0,0,0,0.45)",
        popover: "0 12px 32px -8px rgba(0,0,0,0.6)",
      },
      borderRadius: {
        lg: "10px",
        md: "8px",
        sm: "6px",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.18s ease-out",
      },
    },
  },
  plugins: [],
} satisfies Config;
