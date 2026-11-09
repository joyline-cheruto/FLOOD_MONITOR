/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0b0f14",
        panel: "#111821",
        line: "#1f2a37",
        muted: "#8b98a9",
      },
    },
  },
  plugins: [],
};
