/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: "#22c55e", dim: "#166534" },
        surface: { DEFAULT: "#0f1419", card: "#1a222c", border: "#2d3748" },
        accent: {
          DEFAULT: "#fbbf24",
          muted: "rgba(251, 191, 36, 0.14)",
          ring: "rgba(251, 191, 36, 0.22)",
        },
      },
      fontSize: {
        "ds-display": ["1.75rem", { lineHeight: "2.125rem", fontWeight: "700", letterSpacing: "-0.025em" }],
        "ds-title": ["1.3125rem", { lineHeight: "1.65rem", fontWeight: "600", letterSpacing: "-0.02em" }],
        "ds-section": ["1.0625rem", { lineHeight: "1.45rem", fontWeight: "600", letterSpacing: "-0.01em" }],
        "ds-body": ["0.9375rem", { lineHeight: "1.55rem", fontWeight: "400" }],
        "ds-helper": ["0.8125rem", { lineHeight: "1.45rem", fontWeight: "400" }],
        "ds-micro": ["0.6875rem", { lineHeight: "1.25rem", fontWeight: "500", letterSpacing: "0.04em" }],
      },
      boxShadow: {
        "ds-soft": "0 1px 2px rgba(0,0,0,0.25), 0 8px 24px rgba(0,0,0,0.18)",
        "ds-glow": "0 0 0 1px rgba(52, 211, 153, 0.12), 0 12px 40px rgba(16, 185, 129, 0.08)",
      },
      transitionTimingFunction: {
        "ds-out": "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};
