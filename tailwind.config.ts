import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem"
    },
    extend: {
      colors: {
        page: "#050b15",
        panel: "#0b1526",
        accent: "#2dd4bf",
        muted: "#9ca3af"
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(45,212,191,0.2), 0 15px 40px rgba(5,11,21,0.45)",
        card: "0 18px 60px rgba(3,7,18,0.5)"
      }
    }
  },
  plugins: []
};

export default config;
