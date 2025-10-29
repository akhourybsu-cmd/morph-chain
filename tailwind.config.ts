import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    fontFamily: {
      'outfit': ['Outfit', 'sans-serif'],
    },
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    screens: {
      'xs': '361px',
      'sm': '481px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        'rush-blue': 'hsl(var(--rush-blue))',
        'rush-orange': 'hsl(var(--rush-orange))',
        'rush-red': 'hsl(var(--rush-red))',
        'rush-violet': 'hsl(var(--rush-violet))',
        'rush-green': 'hsl(var(--rush-green))',
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        chain: {
          DEFAULT: "hsl(var(--chain-accent))",
          foreground: "hsl(var(--chain-accent-foreground))",
        },
        rush: {
          start: "hsl(var(--rush-accent-start))",
          end: "hsl(var(--rush-accent-end))",
        },
        "grid-accent-start": "hsl(var(--grid-accent-start))",
        "grid-accent-mid": "hsl(var(--grid-accent-mid))",
        "grid-accent-end": "hsl(var(--grid-accent-end))",
        "grid-glow": "hsl(var(--grid-glow))",
        grid: {
          vowel: {
            from: "hsl(var(--grid-vowel-from))",
            via: "hsl(var(--grid-vowel-via))",
            to: "hsl(var(--grid-vowel-to))",
          },
          consonant: {
            from: "hsl(var(--grid-consonant-from))",
            via: "hsl(var(--grid-consonant-via))",
            to: "hsl(var(--grid-consonant-to))",
          },
          power: {
            from: "hsl(var(--grid-power-from))",
            via: "hsl(var(--grid-power-via))",
            to: "hsl(var(--grid-power-to))",
          },
        },
      },
      backgroundImage: {
        'gradient-prism': 'linear-gradient(135deg, hsl(var(--prism-accent-start)), hsl(var(--prism-accent-mid)), hsl(var(--prism-accent-end)))',
        'gradient-rush': 'linear-gradient(135deg, hsl(var(--rush-accent-start)), hsl(var(--rush-accent-end)))',
        'gradient-grid': 'linear-gradient(135deg, hsl(var(--grid-accent-start)), hsl(var(--grid-accent-mid)), hsl(var(--grid-accent-end)))',
        'gradient-grid-orange': 'linear-gradient(135deg, hsl(var(--gradient-grid-orange-start)), hsl(var(--gradient-grid-orange-mid)), hsl(var(--gradient-grid-orange-end)))',
        'gradient-grid-blue': 'linear-gradient(135deg, hsl(var(--gradient-grid-blue-start)), hsl(var(--gradient-grid-blue-mid)), hsl(var(--gradient-grid-blue-end)))',
        'gradient-grid-purple': 'linear-gradient(135deg, hsl(var(--gradient-grid-purple-start)), hsl(var(--gradient-grid-purple-mid)), hsl(var(--gradient-grid-purple-end)))',
      },
      letterSpacing: {
        tiles: "0.12em",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "flip": {
          "0%": { transform: "rotateY(0deg)" },
          "100%": { transform: "rotateY(180deg)" },
        },
        "scale-in": {
          "0%": { transform: "scale(0)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "slide-in": {
          "0%": { transform: "translateY(-8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "shake": {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-4px)" },
          "75%": { transform: "translateX(4px)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.7" },
        },
        "shimmer": {
          "0%": { opacity: "1", filter: "brightness(1)" },
          "50%": { opacity: "1", filter: "brightness(1.3)" },
          "100%": { opacity: "1", filter: "brightness(1)" },
        },
        "neural-spark": {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "50%": { transform: "scale(1.2)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "0.8" },
        },
        "ripple": {
          "0%": { transform: "translateX(-100%)", opacity: "0" },
          "50%": { opacity: "1" },
          "100%": { transform: "translateX(100%)", opacity: "0" },
        },
        "breathe": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
        },
        "charge-fill": {
          "0%": { transform: "scale(0)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "achievement-pop": {
          "0%": { transform: "translateY(20px) scale(0.8)", opacity: "0" },
          "50%": { transform: "translateY(0) scale(1.05)", opacity: "1" },
          "100%": { transform: "translateY(0) scale(1)", opacity: "1" },
        },
        "confetti": {
          "0%": { transform: "translateY(0) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(-100px) rotate(360deg)", opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "flip": "flip 0.15s ease-out",
        "scale-in": "scale-in 0.09s ease-out",
        "slide-in": "slide-in 0.15s ease-out",
        "shake": "shake 0.12s ease-in-out",
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
        "shimmer": "shimmer 0.3s ease-out",
        "neural-spark": "neural-spark 0.5s ease-out",
        "ripple": "ripple 1s ease-out",
        "breathe": "breathe 2s ease-in-out infinite",
        "charge-fill": "charge-fill 0.3s ease-out forwards",
        "achievement-pop": "achievement-pop 0.4s ease-out",
        "confetti": "confetti 1s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
