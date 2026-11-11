import type { Config } from "tailwindcss";

const brownScale = {
  50: "#F7F4F0",
  100: "#EBE3D8",
  200: "#D8C8B4",
  300: "#BEA486",
  400: "#9E7E5B",
  500: "#7D5E3F",
  600: "#63482E",
  700: "#4D3722",
  800: "#3B2A1A",
  900: "#2B1E13",
  950: "#1B120B",
};

const warmGreyScale = {
  50: "#F7F6F4",
  100: "#EFECE8",
  200: "#DFDBD4",
  300: "#C7C2B8",
  400: "#9C968B",
  500: "#6F6A61",
  600: "#524E47",
  700: "#383530",
  800: "#22201D",
  900: "#141311",
  950: "#0B0A09",
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
        emerald: brownScale,
        green: brownScale,
        teal: brownScale,
        brand: brownScale,
        gray: warmGreyScale,
        slate: warmGreyScale,
        navy: {
          800: "#22201D",
          900: "#141311",
          950: "#0B0A09",
        },
      },
    },
  },
  plugins: [],
};
export default config;
