import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PrestigeThemeToggle } from '@/components/shared/PrestigeThemeToggle';

interface MorphcodeHeaderProps {
  matchActive?: boolean;
  roundInfo?: string;
}

export const MorphcodeHeader = ({ matchActive, roundInfo }: MorphcodeHeaderProps) => {
  const navigate = useNavigate();

  return (
    <header
      className="flex items-center justify-between px-4 py-3"
      style={{ borderBottom: '1px solid hsl(var(--border))' }}
    >
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-1 text-sm transition-colors"
        style={{ color: 'hsl(var(--muted-foreground))' }}
      >
        <ArrowLeft className="w-4 h-4" />
      </button>

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

      <PrestigeThemeToggle colorVar="--muted-foreground" />
    </header>
  );
};
