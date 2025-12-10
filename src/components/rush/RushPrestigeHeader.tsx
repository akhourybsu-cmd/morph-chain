import { Menu, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RushLogo } from "./RushLogo";
import { PrestigeThemeToggle } from "@/components/shared/PrestigeThemeToggle";

interface RushPrestigeHeaderProps {
  onOpenMenu: () => void;
  onOpenHelp: () => void;
}

export const RushPrestigeHeader = ({
  onOpenMenu,
  onOpenHelp,
}: RushPrestigeHeaderProps) => {
  return (
    <header 
      className="h-14 md:h-16 border-b flex-shrink-0"
      style={{ 
        borderColor: 'hsl(var(--rush-card-border))',
        background: 'hsl(var(--rush-page-bg))'
      }}
    >
      <div className="px-3 md:px-4 h-full flex items-center">
        {/* Left: Menu + Theme Toggle */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenMenu}
            className="h-9 w-9 md:h-10 md:w-10 text-[hsl(var(--rush-text-secondary))] hover:text-[hsl(var(--rush-text-primary))] hover:bg-[hsl(var(--rush-pill-bg))]"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <PrestigeThemeToggle colorVar="--rush-text-secondary" />
        </div>
        
        {/* Center spacer */}
        <div className="flex-1" />
        
        {/* Center: Logo */}
        <RushLogo />
        
        {/* Center spacer */}
        <div className="flex-1" />
        
        {/* Right: Help */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenHelp}
            aria-label="How to play"
            className="h-9 w-9 md:h-10 md:w-10 text-[hsl(var(--rush-text-secondary))] hover:text-[hsl(var(--rush-text-primary))] hover:bg-[hsl(var(--rush-pill-bg))]"
          >
            <HelpCircle className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};
