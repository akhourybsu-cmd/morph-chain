import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy } from 'lucide-react';
import { useRushLeaderboard } from '@/hooks/useRushLeaderboard';

interface RushLeaderboardProps {
  mode?: 'daily' | 'practice';
}

export const RushLeaderboard = ({ mode = 'daily' }: RushLeaderboardProps) => {
  const { data, isLoading } = useRushLeaderboard(mode);

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="text-sm text-muted-foreground">Loading leaderboard…</div>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="p-4">
        <div className="text-sm text-muted-foreground">No scores yet today.</div>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Trophy className="h-4 w-4 text-primary" />
        <div className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">
          Global Leaderboard
        </div>
      </div>
      <ul className="divide-y divide-border">
        {data.slice(0, 100).map((row) => (
          <li key={`${row.rank}-${row.user_id}`} className="py-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`w-8 text-right font-bold tabular-nums ${
                row.rank === 1 ? 'text-yellow-500' :
                row.rank === 2 ? 'text-gray-400' :
                row.rank === 3 ? 'text-amber-600' :
                'text-muted-foreground'
              }`}>
                #{row.rank}
              </span>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-lg uppercase">
                    {row.initials || '???'}
                  </span>
                  {row.hard_mode && (
                    <Badge variant="outline" className="text-[10px] px-1 py-0">
                      HARD
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold tabular-nums">{row.score.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground tabular-nums">
                {Number(row.multiplier_max).toFixed(1)}x
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
};
