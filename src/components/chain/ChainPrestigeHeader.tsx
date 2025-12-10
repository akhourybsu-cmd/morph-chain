import { Menu, HelpCircle, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChainLogo } from "./ChainLogo";
import { PrestigeThemeToggle } from "@/components/shared/PrestigeThemeToggle";

interface ChainPrestigeHeaderProps {
  onOpenMenu: () => void;
  onOpenHelp: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const ChainPrestigeHeader = ({
  onOpenMenu,
  onOpenHelp,
  soundEnabled,
  onToggleSound,
}: ChainPrestigeHeaderProps) => {
  return (
    <header 
      className="h-14 md:h-16 border-b flex-shrink-0"
      style={{ 
        borderColor: 'hsl(var(--chain-card-border))',
        background: 'hsl(var(--chain-page-bg))'
      }}
    >
      <div className="px-3 md:px-4 h-full flex items-center">
        {/* Left: Menu + Theme Toggle */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenMenu}
            className="h-9 w-9 md:h-10 md:w-10 text-[hsl(var(--chain-text-secondary))] hover:text-[hsl(var(--chain-text-primary))] hover:bg-[hsl(var(--chain-pill-bg))]"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <PrestigeThemeToggle colorVar="--chain-text-secondary" />
        </div>
        
        {/* Center spacer */}
        <div className="flex-1" />
        
        {/* Center: Logo */}
        <ChainLogo />
        
        {/* Center spacer */}
        <div className="flex-1" />
        
        {/* Right: Sound + Help */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSound}
            aria-label={soundEnabled ? "Mute sounds" : "Enable sounds"}
            className="h-9 w-9 md:h-10 md:w-10 text-[hsl(var(--chain-text-secondary))] hover:text-[hsl(var(--chain-text-primary))] hover:bg-[hsl(var(--chain-pill-bg))]"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 md:w-5 md:h-5" />
            ) : (
              <VolumeX className="w-4 h-4 md:w-5 md:h-5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenHelp}
            aria-label="How to play"
            className="h-9 w-9 md:h-10 md:w-10 text-[hsl(var(--chain-text-secondary))] hover:text-[hsl(var(--chain-text-primary))] hover:bg-[hsl(var(--chain-pill-bg))]"
          >
            <HelpCircle className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};
