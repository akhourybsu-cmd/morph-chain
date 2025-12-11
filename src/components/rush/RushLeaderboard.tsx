import { Card } from '@/components/ui/card';
import { Trophy, Zap } from 'lucide-react';
import { useRushLeaderboard } from '@/hooks/useRushLeaderboard';

interface RushLeaderboardProps {
  mode?: 'daily' | 'practice';
}

export const RushLeaderboard = ({ mode = 'daily' }: RushLeaderboardProps) => {
  const { data, isLoading, error } = useRushLeaderboard(mode, false);

  if (isLoading) {
    return (
      <Card className="p-4 space-y-3 bg-[hsl(var(--rush-card-bg))] border-[hsl(var(--rush-card-border))]">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-[hsl(var(--rush-accent))]" />
          <div className="text-xs uppercase tracking-wide font-semibold text-[hsl(var(--rush-text-secondary))]">
            Daily Leaderboard
          </div>
        </div>
        <div className="p-8 text-center">
          <div className="text-sm text-[hsl(var(--rush-text-secondary))]">Loading leaderboard…</div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4 space-y-3 bg-[hsl(var(--rush-card-bg))] border-[hsl(var(--rush-card-border))]">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-[hsl(var(--rush-accent))]" />
          <div className="text-xs uppercase tracking-wide font-semibold text-[hsl(var(--rush-text-secondary))]">
            Daily Leaderboard
          </div>
        </div>
        <div className="p-8 text-center">
          <div className="text-sm text-destructive">Error loading leaderboard. Please try again.</div>
        </div>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="p-4 space-y-3 bg-[hsl(var(--rush-card-bg))] border-[hsl(var(--rush-card-border))]">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-[hsl(var(--rush-accent))]" />
          <div className="text-xs uppercase tracking-wide font-semibold text-[hsl(var(--rush-text-secondary))]">
            Daily Leaderboard
          </div>
        </div>
        <div className="p-8 text-center">
          <div className="text-sm text-[hsl(var(--rush-text-secondary))]">No scores yet today.</div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-3 bg-[hsl(var(--rush-card-bg))] border-[hsl(var(--rush-card-border))]">
      <div className="flex items-center gap-2">
        <Trophy className="h-4 w-4 text-[hsl(var(--rush-accent))]" />
        <div className="text-xs uppercase tracking-wide font-semibold text-[hsl(var(--rush-text-secondary))]">
          Daily Leaderboard
        </div>
      </div>
      
      <ul className="divide-y divide-[hsl(var(--rush-card-border))]">
        {data.slice(0, 100).map((row) => (
          <li key={`${row.rank}-${row.user_id}`} className="py-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`w-8 text-right font-bold tabular-nums ${
                row.rank === 1 ? 'text-yellow-500' :
                row.rank === 2 ? 'text-gray-400' :
                row.rank === 3 ? 'text-amber-600' :
                'text-[hsl(var(--rush-text-secondary))]'
              }`}>
                #{row.rank}
              </span>
              <div className="flex flex-col">
                <span className="font-mono font-bold text-lg uppercase text-[hsl(var(--rush-text-primary))]">
                  {row.initials || '???'}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold tabular-nums text-[hsl(var(--rush-text-primary))]">{row.score.toLocaleString()}</div>
              <div className="text-xs text-[hsl(var(--rush-text-secondary))] tabular-nums flex items-center justify-end gap-1">
                <Zap className="h-3 w-3" />
                {Number(row.multiplier_max).toFixed(1)}x
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
};
