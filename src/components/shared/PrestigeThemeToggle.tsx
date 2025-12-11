import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

interface PrestigeThemeToggleProps {
  colorVar?: string; // e.g., "--chain-text-secondary"
  className?: string;
}

export const PrestigeThemeToggle = ({ 
  colorVar = "--grid-text-secondary",
  className = ""
}: PrestigeThemeToggleProps) => {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <button
      onClick={toggleTheme}
      className={`h-8 w-8 flex items-center justify-center rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/10 ${className}`}
      style={{ color: `hsl(var(${colorVar}))` }}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
};
