import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGridLeaderboard } from "@/hooks/useGridLeaderboard";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

interface GridLeaderboardProps {
  dateSeed: string;
}

export const GridLeaderboard = ({ dateSeed }: GridLeaderboardProps) => {
  const { data: entries = [], isLoading } = useGridLeaderboard();
  const [myUserId, setMyUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setMyUserId(user?.id || null);
    });
  }, []);

  const formatTime = (ms?: number) => {
    if (!ms) return "—";
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-4 pb-6">
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">Loading leaderboard...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Today's Leaderboard</CardTitle>
            <Badge variant="outline">Daily #{dateSeed}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Finish today's grid to place on the board.
            </p>
          ) : (
            <div className="space-y-2">
              {/* Header */}
              <div className="grid grid-cols-[40px_1fr_60px_60px_60px] gap-2 text-xs font-medium text-muted-foreground border-b pb-2">
                <div>#</div>
                <div>Alias</div>
                <div className="text-right">Moves</div>
                <div className="text-right">Words</div>
                <div className="text-right">Time</div>
              </div>

              {/* Rows */}
              {entries.slice(0, 10).map((entry, index) => {
                const isMe = entry.user_id === myUserId;
                return (
                  <div
                  key={entry.user_id}
                    className={`grid grid-cols-[40px_1fr_60px_60px_60px] gap-2 items-center py-2 rounded ${
                      isMe ? 'bg-primary/10 ring-1 ring-primary/20' : ''
                    }`}
                  >
                    <div className="font-semibold text-sm">
                      {entry.rank}
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="truncate text-sm">
                        {entry.initials || "Anonymous"}
                      </span>
                      {isMe && <Badge variant="secondary" className="text-xs">You</Badge>}
                    </div>
                    <div className="text-right font-semibold text-sm">
                      {entry.moves}
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      {entry.words_used}
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      {formatTime(entry.time_to_complete_ms)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Personal Best Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Your Personal Best</CardTitle>
        </CardHeader>
        <CardContent>
          {myUserId && entries.find(e => e.user_id === myUserId) ? (
            <div className="text-center">
              <p className="text-2xl font-semibold">
                {entries.find(e => e.user_id === myUserId)?.moves} moves
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {entries.find(e => e.user_id === myUserId)?.words_used} words · Rank #{entries.find(e => e.user_id === myUserId)?.rank}
              </p>
            </div>
          ) : (
            <p className="text-center text-muted-foreground text-sm">
              Complete the grid to see your result
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
