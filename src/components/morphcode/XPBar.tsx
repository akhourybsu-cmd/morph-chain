import { Progress } from '@/components/ui/progress';
import { Flame, Star } from 'lucide-react';
import { getRankTitle, getXPForLevel, XP_PER_LEVEL } from '@/lib/morphcode/types';

interface XPBarProps {
  xp: number;
  level: number;
  wins: number;
  streak: number;
  compact?: boolean;
}

export const XPBar = ({ xp, level, wins, streak, compact }: XPBarProps) => {
  const xpInLevel = xp - getXPForLevel(level);
  const progress = Math.min(100, (xpInLevel / XP_PER_LEVEL) * 100);
  const rank = getRankTitle(wins);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span
          className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
          style={{ background: 'hsl(var(--code-accent) / 0.15)', color: 'hsl(var(--code-accent))' }}
        >
          Lv.{level}
        </span>
        {streak >= 2 && (
          <span className="flex items-center gap-0.5 text-[10px] font-bold" style={{ color: 'hsl(15, 90%, 55%)' }}>
            <Flame className="w-3 h-3" />
            {streak}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className="w-full rounded-xl p-3 space-y-2"
      style={{
        background: 'hsl(var(--code-card-bg))',
        border: '1px solid hsl(var(--code-card-border))',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-mono font-bold px-2 py-0.5 rounded-full"
            style={{ background: 'hsl(var(--code-accent) / 0.15)', color: 'hsl(var(--code-accent))' }}
          >
            Lv.{level}
          </span>
          <span className="text-xs font-inter font-medium" style={{ color: 'hsl(var(--code-text-secondary))' }}>
            {rank}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {streak >= 2 && (
            <span className="flex items-center gap-0.5 text-xs font-bold animate-pulse" style={{ color: 'hsl(15, 90%, 55%)' }}>
              <Flame className="w-3.5 h-3.5" />
              {streak}
            </span>
          )}
          <span className="text-[10px] font-mono" style={{ color: 'hsl(var(--code-text-muted))' }}>
            {xpInLevel}/{XP_PER_LEVEL} XP
          </span>
        </div>
      </div>
      <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'hsl(var(--code-pill-bg))' }}>
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, hsl(var(--code-accent)), hsl(var(--code-success)))',
          }}
        />
      </div>
    </div>
  );
};
