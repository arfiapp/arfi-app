import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--purple-deep)",
        card: "var(--card-bg)",
        accent: "var(--purple-bright)",
        accentPink: "var(--pink-glow)",
        accentGlow: "var(--purple-glow)",
        textPrimary: "var(--text-primary)",
        textSecondary: "var(--text-secondary)",
        textMuted: "var(--text-muted)",
        border: "var(--card-border)"
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-outfit)", "system-ui", "sans-serif"]
      },
      boxShadow: {
        glow:     "0 0 24px rgba(168, 85, 247, 0.4)",
        glowLg:   "0 0 48px rgba(168, 85, 247, 0.5)",
        glowPink: "0 0 24px rgba(236, 72, 153, 0.35)"
      }
    }
  },
  plugins: []
};

export default config;
