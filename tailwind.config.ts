import type { Config } from "tailwindcss";

// Primary: Deep Teal (#0F766E at 600) for navigation, headers, and main buttons
const deepTealScale = {
  50: "#F0FDFA",
  100: "#CCFBF1",
  200: "#99F6E4",
  300: "#5EEAD4",
  400: "#2DD4BF",
  500: "#14B8A6",
  600: "#0F766E",
  700: "#115E59",
  800: "#134E4A",
  900: "#0D3B38",
  950: "#042F2E",
};

// Success / Verified: Clear Green for verified listings and trust badges
const verifiedGreenScale = {
  50: "#F0FDF4",
  100: "#DCFCE7",
  200: "#BBF7D0",
  300: "#86EFAC",
  400: "#4ADE80",
  500: "#22C55E",
  600: "#16A34A",
  700: "#15803D",
  800: "#166534",
  900: "#14532D",
  950: "#052E16",
};

// Accent: Warm Amber / Soft Orange (#F59E0B at 500) for high-visibility calls to action
const warmAmberScale = {
  50: "#FFFBEB",
  100: "#FEF3C7",
  200: "#FDE68A",
  300: "#FCD34D",
  400: "#FBBF24",
  500: "#F59E0B",
  600: "#D97706",
  700: "#B45309",
  800: "#92400E",
  900: "#78350F",
  950: "#451A03",
};

// Text & Surfaces: Dark Slate (#1E293B at 900) and Off-White / Light Slate (#F8FAFC at 50)
const slateTextScale = {
  50: "#F8FAFC",
  100: "#F1F5F9",
  200: "#E2E8F0",
  300: "#CBD5E1",
  400: "#94A3B8",
  500: "#64748B",
  600: "#475569",
  700: "#334155",
  800: "#1E293B",
  900: "#1E293B",
  950: "#0F172A",
};

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        emerald: deepTealScale,
        teal: deepTealScale,
        brand: deepTealScale,
        green: verifiedGreenScale,
        amber: warmAmberScale,
        gray: slateTextScale,
        slate: slateTextScale,
        navy: {
          800: "#1E293B",
          900: "#0F172A",
          950: "#020617",
        },
      },
    },
  },
  plugins: [],
};
export default config;
