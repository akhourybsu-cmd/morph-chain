import { useState } from "react";
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Zap } from 'lucide-react';
import { useRushLeaderboard } from '@/hooks/useRushLeaderboard';

interface RushLeaderboardProps {
  mode?: 'daily' | 'practice';
}

export const RushLeaderboard = ({ mode = 'daily' }: RushLeaderboardProps) => {
  const [selectedMode, setSelectedMode] = useState<'normal' | 'hard'>('normal');
  const { data: normalData, isLoading: normalLoading } = useRushLeaderboard(mode, false);
  const { data: hardData, isLoading: hardLoading } = useRushLeaderboard(mode, true);

  const renderLeaderboard = (data: any[] | undefined, isLoading: boolean, showHardBadge: boolean = false) => {
    if (isLoading) {
      return (
        <div className="p-8 text-center">
          <div className="text-sm text-muted-foreground">Loading leaderboard…</div>
        </div>
      );
    }

    if (!data || data.length === 0) {
      return (
        <div className="p-8 text-center">
          <div className="text-sm text-muted-foreground">No scores yet today.</div>
        </div>
      );
    }

    return (
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
                <span className="font-mono font-bold text-lg uppercase">
                  {row.initials || '???'}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold tabular-nums">{row.score.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground tabular-nums flex items-center justify-end gap-1">
                <Zap className="h-3 w-3" />
                {Number(row.multiplier_max).toFixed(1)}x
              </div>
            </div>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Trophy className="h-4 w-4 text-primary" />
        <div className="text-xs uppercase tracking-wide font-semibold text-muted-foreground">
          Global Leaderboard
        </div>
      </div>
      
      <Tabs value={selectedMode} onValueChange={(v) => setSelectedMode(v as 'normal' | 'hard')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="normal">Normal Mode</TabsTrigger>
          <TabsTrigger value="hard">Hard Mode</TabsTrigger>
        </TabsList>
        
        <TabsContent value="normal" className="mt-3">
          {renderLeaderboard(normalData, normalLoading)}
        </TabsContent>
        
        <TabsContent value="hard" className="mt-3">
          {renderLeaderboard(hardData, hardLoading, true)}
        </TabsContent>
      </Tabs>
    </Card>
  );
};
