/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#22c55e", dim: "#166534" },
        surface: { DEFAULT: "#0f1419", card: "#1a222c", border: "#2d3748" },
      },
    },
  },
  plugins: [],
};
