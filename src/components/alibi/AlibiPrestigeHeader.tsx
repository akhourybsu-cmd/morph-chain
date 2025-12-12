import React from 'react';
import { Menu, HelpCircle, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlibiLogo } from './AlibiLogo';
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
    <header className="h-14 md:h-16 flex items-center px-4 border-b border-alibi-divider bg-alibi-card-bg">
      {/* Left: Menu + Theme */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="text-alibi-text-primary hover:bg-alibi-divider/50"
        >
          <Menu className="h-5 w-5" />
        </Button>
        {themeToggle}
      </div>

      {/* Center: Logo */}
      <div className="flex-1 flex justify-center">
        <AlibiLogo />
      </div>

      {/* Right: Sound + Help */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="text-alibi-text-primary hover:bg-alibi-divider/50"
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
          className="text-alibi-text-primary hover:bg-alibi-divider/50"
        >
          <HelpCircle className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
