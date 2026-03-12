import { useState } from 'react';
import { Menu, HelpCircle, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MorphCodeLogo } from './MorphCodeLogo';
import { MorphCodeMenuSheet } from './MorphCodeMenuSheet';
import { MorphcodeHowToPlay } from './MorphcodeHowToPlay';
import { PrestigeThemeToggle } from '@/components/shared/PrestigeThemeToggle';
import { isSoundEnabled, toggleSound } from '@/lib/morphcode/audioManager';

interface MorphcodeHeaderProps {
  matchActive?: boolean;
  roundInfo?: string;
}

export const MorphcodeHeader = ({ matchActive, roundInfo }: MorphcodeHeaderProps) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [howToPlayOpen, setHowToPlayOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(isSoundEnabled());

  const handleToggleSound = () => {
    const newState = toggleSound();
    setSoundOn(newState);
  };

  return (
    <>
      <header
        className="h-14 md:h-16 border-b flex-shrink-0"
        style={{
          borderColor: 'hsl(var(--code-card-border))',
          background: 'hsl(var(--code-page-bg))',
        }}
      >
        <div className="px-3 md:px-4 h-full flex items-center">
          {/* Left */}
          <div className="flex-1 flex items-center justify-start gap-0.5 md:gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMenuOpen(true)}
              className="h-8 w-8 md:h-10 md:w-10 text-[hsl(var(--code-text-secondary))] hover:text-[hsl(var(--code-text-primary))] hover:bg-[hsl(var(--code-pill-bg))]"
            >
              <Menu className="w-4 h-4 md:w-5 md:h-5" />
            </Button>
            <PrestigeThemeToggle colorVar="--code-text-secondary" />
          </div>

          {/* Center */}
          <div className="flex flex-col items-center justify-center">
            <MorphCodeLogo />
            {roundInfo && (
              <span
                className="text-[9px] md:text-[10px] uppercase tracking-wider"
                style={{ color: 'hsl(var(--code-text-muted))' }}
              >
                {roundInfo}
              </span>
            )}
          </div>

          {/* Right */}
          <div className="flex-1 flex items-center justify-end gap-0.5 md:gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleSound}
              className="h-8 w-8 md:h-10 md:w-10 text-[hsl(var(--code-text-secondary))] hover:text-[hsl(var(--code-text-primary))] hover:bg-[hsl(var(--code-pill-bg))]"
            >
              {soundOn
                ? <Volume2 className="w-4 h-4 md:w-5 md:h-5" />
                : <VolumeX className="w-4 h-4 md:w-5 md:h-5" />
              }
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setHowToPlayOpen(true)}
              className="h-8 w-8 md:h-10 md:w-10 text-[hsl(var(--code-text-secondary))] hover:text-[hsl(var(--code-text-primary))] hover:bg-[hsl(var(--code-pill-bg))]"
            >
              <HelpCircle className="w-4 h-4 md:w-5 md:h-5" />
            </Button>
          </div>
        </div>
      </header>

      <MorphCodeMenuSheet open={menuOpen} onOpenChange={setMenuOpen} />
      <MorphcodeHowToPlay open={howToPlayOpen} onOpenChange={setHowToPlayOpen} />
    </>
  );
};
