import { Menu, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MeasuredLogo } from './MeasuredLogo';
import { PrestigeThemeToggle } from '@/components/shared/PrestigeThemeToggle';

interface MeasuredPrestigeHeaderProps {
  onMenuClick: () => void;
  onHelpClick: () => void;
}

export function MeasuredPrestigeHeader({ 
  onMenuClick, 
  onHelpClick,
}: MeasuredPrestigeHeaderProps) {
  return (
    <header 
      className="h-14 md:h-16 border-b flex-shrink-0"
      style={{ 
        borderColor: 'hsl(var(--measured-card-border))',
        background: 'hsl(var(--measured-page-bg))'
      }}
    >
      <div className="px-3 md:px-4 h-full flex items-center">
        {/* Left: Menu + Theme Toggle */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="h-9 w-9 md:h-10 md:w-10 text-measured-text-secondary hover:text-measured-text-primary hover:bg-measured-card"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <PrestigeThemeToggle colorVar="--measured-text-secondary" />
        </div>
        
        {/* Center spacer */}
        <div className="flex-1" />
        
        {/* Center: Logo */}
        <MeasuredLogo />
        
        {/* Center spacer */}
        <div className="flex-1" />
        
        {/* Right: Help */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onHelpClick}
            aria-label="How to play"
            className="h-9 w-9 md:h-10 md:w-10 text-measured-text-secondary hover:text-measured-text-primary hover:bg-measured-card"
          >
            <HelpCircle className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
