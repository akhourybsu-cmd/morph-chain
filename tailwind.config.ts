import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    fontFamily: {
      'outfit': ['Outfit', 'sans-serif'],
      'playfair': ['Playfair Display', 'Georgia', 'serif'],
      'inter': ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
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
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
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
        measured: {
          page: "hsl(var(--measured-page-bg))",
          card: "hsl(var(--measured-card-bg))",
          "card-border": "hsl(var(--measured-card-border))",
          "text-primary": "hsl(var(--measured-text-primary))",
          "text-secondary": "hsl(var(--measured-text-secondary))",
          "text-muted": "hsl(var(--measured-text-muted))",
          accent: "hsl(var(--measured-accent))",
          "tile-bg": "hsl(var(--measured-tile-bg))",
          "tile-border": "hsl(var(--measured-tile-border))",
          "band-exact": "hsl(var(--measured-band-exact))",
          "band-sharp": "hsl(var(--measured-band-sharp))",
          "band-close": "hsl(var(--measured-band-close))",
          "band-warm": "hsl(var(--measured-band-warm))",
          "band-wide": "hsl(var(--measured-band-wide))",
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
        "confetti-fall": {
          "0%": { transform: "translateY(-20px) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(100vh) rotate(720deg)", opacity: "0" },
        },
        "tile-pop-small": {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.04)" },
          "100%": { transform: "scale(1)" },
        },
        "tile-pop-medium": {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.06)" },
          "100%": { transform: "scale(1)" },
        },
        "tile-pop-large": {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.08)" },
          "100%": { transform: "scale(1)" },
        },
        "tile-pop-epic": {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.1)" },
          "100%": { transform: "scale(1)" },
        },
        "tile-pop-subtle": {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.03)" },
          "100%": { transform: "scale(1)" },
        },
        "tile-flip": {
          "0%": { transform: "scale(1)" },
          "30%": { transform: "scale(0.9)" },
          "60%": { transform: "scale(1.02)" },
          "100%": { transform: "scale(1)" },
        },
        "score-pop-subtle": {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "50%": { transform: "scale(1.05)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "upgrade-spark": {
          "0%": { transform: "scale(1)", filter: "brightness(1)", boxShadow: "0 0 0 rgba(255,255,255,0)" },
          "15%": { transform: "scale(1.2)", filter: "brightness(1.6)", boxShadow: "0 0 20px rgba(255,255,255,0.8)" },
          "50%": { transform: "scale(1.15)", filter: "brightness(1.4)", boxShadow: "0 0 15px rgba(255,255,255,0.6)" },
          "85%": { transform: "scale(1.1)", filter: "brightness(1.3)", boxShadow: "0 0 10px rgba(255,255,255,0.4)" },
          "100%": { transform: "scale(1)", filter: "brightness(1)", boxShadow: "0 0 0 rgba(255,255,255,0)" },
        },
        "tile-upgrade": {
          "0%": { 
            transform: "scale(1)",
            boxShadow: "0 0 0 rgba(255,255,255,0)"
          },
          "25%": { 
            transform: "scale(1.15)",
            boxShadow: "0 0 30px rgba(255,255,255,0.9)"
          },
          "50%": { 
            transform: "scale(1.1)",
            boxShadow: "0 0 20px rgba(255,255,255,0.6)"
          },
          "100%": { 
            transform: "scale(1)",
            boxShadow: "0 0 0 rgba(255,255,255,0)"
          }
        },
        "float-score": {
          "0%": { transform: "translateY(0) scale(1)", opacity: "1" },
          "100%": { transform: "translateY(-50px) scale(0.8)", opacity: "0" },
        },
        "word-burst": {
          "0%": { transform: "scale(0.5)", opacity: "0.8" },
          "100%": { transform: "scale(2.5)", opacity: "0" },
        },
        "score-pop": {
          "0%": { transform: "scale(0.5)", opacity: "0" },
          "40%": { transform: "scale(1.3)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "score-travel": {
          "0%": { transform: "scale(1) translateY(0)", opacity: "1" },
          "100%": { transform: "scale(0.4) translateY(35vh)", opacity: "0" },
        },
        "badge-pulse": {
          "0%": { transform: "scale(1)", boxShadow: "0 0 0 transparent" },
          "50%": { transform: "scale(1.25)", boxShadow: "0 0 16px hsl(var(--chain-accent) / 0.7)" },
          "100%": { transform: "scale(1)", boxShadow: "0 0 0 transparent" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "orb-travel": {
          "0%": { 
            transform: "translate(0, 0) scale(1)",
            opacity: "1",
            boxShadow: "0 0 20px rgba(251,191,36,0.8)"
          },
          "70%": { 
            transform: "translate(var(--target-x), var(--target-y)) scale(0.6)",
            opacity: "0.9",
            boxShadow: "0 0 30px rgba(251,191,36,1)"
          },
          "100%": { 
            transform: "translate(var(--target-x), var(--target-y)) scale(0)",
            opacity: "0",
            boxShadow: "0 0 50px rgba(255,255,255,1)"
          }
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
        "confetti-fall": "confetti-fall 2s ease-out forwards",
        "tile-pop-small": "tile-pop-small 0.2s ease-out",
        "tile-pop-medium": "tile-pop-medium 0.2s ease-out",
        "tile-pop-large": "tile-pop-large 0.25s ease-out",
        "tile-pop-epic": "tile-pop-epic 0.25s ease-out",
        "tile-pop-subtle": "tile-pop-subtle 0.15s ease-out",
        "tile-flip": "tile-flip 0.22s ease-out",
        "score-pop-subtle": "score-pop-subtle 0.4s ease-out forwards",
        "upgrade-spark": "upgrade-spark 1.2s ease-in-out",
        "tile-upgrade": "tile-upgrade 0.6s ease-out",
        "float-score": "float-score 0.8s ease-out forwards",
        "word-burst": "word-burst 0.5s ease-out forwards",
        "score-pop": "score-pop 0.5s ease-out forwards",
        "score-travel": "score-travel 0.5s ease-out forwards",
        "badge-pulse": "badge-pulse 0.5s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "orb-travel": "orb-travel 0.45s ease-in forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
