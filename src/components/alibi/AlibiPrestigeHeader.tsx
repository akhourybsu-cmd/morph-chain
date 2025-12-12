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
    <header 
      className="py-3 px-4 border-b"
      style={{ 
        borderColor: 'hsl(var(--alibi-divider))',
        background: 'hsl(var(--alibi-page-bg))'
      }}
    >
      <div className="flex items-center justify-between">
        {/* Left: Menu + Theme */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="h-8 w-8 text-alibi-text-muted hover:text-alibi-text-secondary hover:bg-transparent"
          >
            <Menu className="h-4 w-4" />
          </Button>
          {themeToggle}
        </div>

        {/* Center: Logo */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <AlibiLogo />
        </div>

        {/* Right: Sound + Help */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="h-8 w-8 text-alibi-text-muted hover:text-alibi-text-secondary hover:bg-transparent"
          >
            {soundEnabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onHelpClick}
            className="h-8 w-8 text-alibi-text-muted hover:text-alibi-text-secondary hover:bg-transparent"
          >
            <HelpCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
