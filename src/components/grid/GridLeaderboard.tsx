import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { loadGridLeaderboard, GridLBEntry } from "@/lib/gridStorage";
import { Info } from "lucide-react";

interface GridLeaderboardProps {
  dateSeed: string;
}

export const GridLeaderboard = ({ dateSeed }: GridLeaderboardProps) => {
  const entries = loadGridLeaderboard(dateSeed).slice(0, 10);
  const myEntryId = typeof window !== 'undefined' 
    ? localStorage.getItem('morphGrid_myEntryId') 
    : null;

  const formatTime = (ms?: number) => {
    if (!ms) return "—";
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4 pb-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Global leaderboard unavailable—showing local device results.
        </AlertDescription>
      </Alert>

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
              {entries.map((entry, index) => {
                const isMe = entry.id === myEntryId;
                return (
                  <div
                    key={entry.id}
                    className={`grid grid-cols-[40px_1fr_60px_60px_60px] gap-2 items-center py-2 rounded ${
                      isMe ? 'bg-primary/10 ring-1 ring-primary/20' : ''
                    }`}
                  >
                    <div className="font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="truncate text-sm">
                        {entry.deviceAlias || "Anonymous"}
                      </span>
                      {isMe && <Badge variant="secondary" className="text-xs">You</Badge>}
                    </div>
                    <div className="text-right font-semibold text-sm">
                      {entry.moves}
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      {entry.wordsUsed}
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      {formatTime(entry.timeToCompleteMs)}
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
          {entries.filter(e => e.id === myEntryId).length > 0 ? (
            <div className="text-center">
              <p className="text-2xl font-semibold">
                {entries.find(e => e.id === myEntryId)?.moves} moves
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {entries.find(e => e.id === myEntryId)?.wordsUsed} words
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
