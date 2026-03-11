import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import { PrestigeThemeToggle } from '@/components/shared/PrestigeThemeToggle';
import { MorphcodeHowToPlay } from './MorphcodeHowToPlay';

interface MorphcodeHeaderProps {
  matchActive?: boolean;
  roundInfo?: string;
}

export const MorphcodeHeader = ({ matchActive, roundInfo }: MorphcodeHeaderProps) => {
  const navigate = useNavigate();
  const [howToPlayOpen, setHowToPlayOpen] = useState(false);

  return (
    <>
      <header
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid hsl(var(--border))' }}
      >
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate('/')}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <PrestigeThemeToggle colorVar="--muted-foreground" />
        </div>

        <div className="flex flex-col items-center">
          <h1
            className="font-serif text-lg font-bold tracking-wide"
            style={{ color: 'hsl(var(--foreground))' }}
          >
            MORPHCODE
          </h1>
          {roundInfo && (
            <span className="text-[10px] uppercase tracking-wider" style={{ color: 'hsl(var(--muted-foreground))' }}>
              {roundInfo}
            </span>
          )}
        </div>

        <button
          onClick={() => setHowToPlayOpen(true)}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: 'hsl(var(--muted-foreground))' }}
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </header>

      <MorphcodeHowToPlay open={howToPlayOpen} onOpenChange={setHowToPlayOpen} />
    </>
  );
};
