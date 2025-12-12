import React from 'react';
import { Menu, HelpCircle, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlibiLogo } from './AlibiLogo';
import { PrestigeThemeToggle } from '@/components/shared/PrestigeThemeToggle';
import { useAlibiSettings } from '@/hooks/useAlibiSettings';

interface AlibiPrestigeHeaderProps {
  onMenuClick: () => void;
  onHelpClick: () => void;
  themeToggle: React.ReactNode;
}

export function AlibiPrestigeHeader({ 
  onMenuClick, 
  onHelpClick,
  themeToggle 
}: AlibiPrestigeHeaderProps) {
  const { soundEnabled, setSoundEnabled } = useAlibiSettings();

  return (
    <header 
      className="flex items-center justify-between h-14 md:h-16 px-3 md:px-4"
      style={{ 
        borderBottom: '1px solid hsl(var(--alibi-divider))',
        background: 'hsl(var(--alibi-page-bg))'
      }}
    >
      {/* Left side - Menu and Theme Toggle */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="h-9 w-9 md:h-10 md:w-10"
          style={{ color: 'hsl(var(--alibi-text-secondary))' }}
        >
          <Menu className="h-5 w-5" />
        </Button>
        {themeToggle}
      </div>

      {/* Center - Logo with flex spacers */}
      <div className="flex-1 flex justify-center">
        <AlibiLogo />
      </div>

      {/* Right side - Sound and Help */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="h-9 w-9 md:h-10 md:w-10"
          style={{ color: 'hsl(var(--alibi-text-secondary))' }}
        >
          {soundEnabled ? (
            <Volume2 className="h-5 w-5" />
          ) : (
            <VolumeX className="h-5 w-5" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onHelpClick}
          className="h-9 w-9 md:h-10 md:w-10"
          style={{ color: 'hsl(var(--alibi-text-secondary))' }}
        >
          <HelpCircle className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
