/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          base: "var(--bg-base)",
          elevated: "var(--bg-elevated)",
          card: "var(--bg-card)",
          "card-hover": "var(--bg-card-hover)",
        },
        accent: {
          400: "var(--accent-400)",
          500: "var(--accent-500)",
          600: "var(--accent-600)",
        },
        pink: { 500: "var(--pink-500)" },
        cyan: { 500: "var(--cyan-500)" },
        emerald: { 500: "var(--emerald-500)" },
        amber: { 500: "var(--amber-500)" },
        red: { 500: "var(--red-500)" },
        blue: { 500: "var(--blue-500)" },
      },
      fontFamily: {
        sans: "var(--font-sans)",
        display: "var(--font-display)",
      },
      maxWidth: {
        "7xl": "var(--max-w-7xl)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        full: "var(--radius-full)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        glow: "var(--shadow-glow)",
      },
    },
  },
  plugins: [],
};
