import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        coral: {
          50: "#fef3ee",
          100: "#fde4d8",
          200: "#fbc7b0",
          300: "#f8a27e",
          400: "#f4764a",
          500: "#d97757",
          600: "#c45a3a",
          700: "#a3452e",
          800: "#833a2a",
          900: "#6b3226",
          950: "#3a1712",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
