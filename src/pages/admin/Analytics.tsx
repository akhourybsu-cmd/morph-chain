import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, Users, Target, Zap } from "lucide-react";

export default function Analytics() {
  const [stats, setStats] = useState({
    totalSessions: 0,
    completedSessions: 0,
    winRate: 0,
    avgMovesPerWin: 0,
    avgHintsUsed: 0,
    avgInvalidGuesses: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const { data: sessions, error } = await supabase
        .from("player_sessions")
        .select("*");

      if (error) throw error;

      const completed = sessions?.filter((s) => s.completed) || [];
      const won = sessions?.filter((s) => s.won) || [];

      const totalMoves = won.reduce((sum, s) => {
        const moves = Array.isArray(s.moves) ? s.moves.length : 0;
        return sum + moves;
      }, 0);

      const totalHints = sessions?.reduce((sum, s) => sum + (s.hints_used || 0), 0) || 0;
      const totalInvalid = sessions?.reduce((sum, s) => sum + (s.invalid_guesses || 0), 0) || 0;

      setStats({
        totalSessions: sessions?.length || 0,
        completedSessions: completed.length,
        winRate: completed.length > 0 ? (won.length / completed.length) * 100 : 0,
        avgMovesPerWin: won.length > 0 ? totalMoves / won.length : 0,
        avgHintsUsed: sessions?.length > 0 ? totalHints / sessions.length : 0,
        avgInvalidGuesses: sessions?.length > 0 ? totalInvalid / sessions.length : 0,
      });
    } catch (error: any) {
      toast({
        title: "Error fetching analytics",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Player performance and engagement metrics</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSessions}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedSessions} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.winRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Of completed sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Moves/Win</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgMovesPerWin.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Successful completions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Hints Used</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgHintsUsed.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Per session
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Difficulty Metrics</CardTitle>
          <CardDescription>Player struggle indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Average Invalid Guesses</p>
                <p className="text-sm text-muted-foreground">Per session</p>
              </div>
              <div className="text-2xl font-bold">{stats.avgInvalidGuesses.toFixed(2)}</div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Completion Rate</p>
                <p className="text-sm text-muted-foreground">Started vs finished</p>
              </div>
              <div className="text-2xl font-bold">
                {stats.totalSessions > 0
                  ? ((stats.completedSessions / stats.totalSessions) * 100).toFixed(1)
                  : 0}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
