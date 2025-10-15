import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useArcadeLeaderboard } from "@/hooks/useArcadeLeaderboard";
import { Loader2 } from "lucide-react";

export const ArcadeLeaderboard = () => {
  const { data: leaderboard, isLoading } = useArcadeLeaderboard();

  const renderLeaderboard = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
        </div>
      );
    }

    if (!leaderboard || leaderboard.length === 0) {
      return (
        <div className="text-center py-8 text-slate-400">
          No completions yet today. Be the first!
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {leaderboard.map((entry) => (
          <div
            key={entry.user_id}
            className="flex items-center justify-between p-3 bg-slate-800 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg font-bold text-cyan-400 w-8">
                #{entry.rank}
              </span>
              <span className="text-slate-200">
                {entry.initials || 'Anonymous'}
              </span>
            </div>
            <div className="text-right">
              <div className="text-slate-100 font-semibold">
                {entry.moves} moves
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-cyan-400">Today's Top Solvers</CardTitle>
      </CardHeader>
      <CardContent>{renderLeaderboard()}</CardContent>
    </Card>
  );
};
