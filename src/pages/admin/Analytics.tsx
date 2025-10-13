import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, Users, Target, Zap, Download, Gamepad2, Trophy, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

interface AnalyticsData {
  // Morph Chain Stats
  chainSessions: number;
  chainCompleted: number;
  chainWinRate: number;
  chainAvgMoves: number;
  chainAvgHints: number;
  
  // Morph Rush Stats
  rushRuns: number;
  rushCompleted: number;
  rushAvgScore: number;
  rushMaxScore: number;
  rushHardModeRuns: number;
  
  // Prism Stats
  prismFeedback: number;
  prismAvgRating: number;
  
  // Overall Stats
  totalUsers: number;
  totalGamesPlayed: number;
  dailyActiveUsers: number;
}

export default function Analytics() {
  const [stats, setStats] = useState<AnalyticsData>({
    chainSessions: 0,
    chainCompleted: 0,
    chainWinRate: 0,
    chainAvgMoves: 0,
    chainAvgHints: 0,
    rushRuns: 0,
    rushCompleted: 0,
    rushAvgScore: 0,
    rushMaxScore: 0,
    rushHardModeRuns: 0,
    prismFeedback: 0,
    prismAvgRating: 0,
    totalUsers: 0,
    totalGamesPlayed: 0,
    dailyActiveUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Fetch Morph Chain data
      const { data: sessions, error: sessionsError } = await supabase
        .from("player_sessions")
        .select("*");

      if (sessionsError) throw sessionsError;

      // Fetch Morph Rush data
      const { data: rushRuns, error: rushError } = await supabase
        .from("rush_runs")
        .select("*");

      if (rushError) throw rushError;

      // Fetch Prism feedback
      const { data: prismData, error: prismError } = await supabase
        .from("prism_feedback")
        .select("*");

      if (prismError) throw prismError;

      // Calculate Morph Chain stats
      const completed = sessions?.filter((s) => s.completed) || [];
      const won = sessions?.filter((s) => s.won) || [];
      const totalMoves = won.reduce((sum, s) => {
        const moves = Array.isArray(s.moves) ? s.moves.length : 0;
        return sum + moves;
      }, 0);
      const totalHints = sessions?.reduce((sum, s) => sum + (s.hints_used || 0), 0) || 0;

      // Calculate Morph Rush stats
      const rushCompleted = rushRuns?.filter((r) => r.finished_at) || [];
      const rushScores = rushCompleted.map(r => r.score || 0);
      const rushAvgScore = rushScores.length > 0 
        ? rushScores.reduce((a, b) => a + b, 0) / rushScores.length 
        : 0;
      const rushMaxScore = rushScores.length > 0 ? Math.max(...rushScores) : 0;
      const rushHardMode = rushRuns?.filter((r) => r.hard_mode) || [];

      // Calculate Prism stats
      const prismRatings = prismData?.filter(p => p.rating).map(p => p.rating) || [];
      const prismAvgRating = prismRatings.length > 0
        ? prismRatings.reduce((a, b) => a + b, 0) / prismRatings.length
        : 0;

      // Calculate overall stats
      const uniqueChainUsers = new Set(sessions?.filter(s => s.user_id).map(s => s.user_id));
      const uniqueRushUsers = new Set(rushRuns?.filter(r => r.user_id).map(r => r.user_id));
      const allUsers = new Set([...uniqueChainUsers, ...uniqueRushUsers]);

      // Get recent activity (last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const recentSessions = sessions?.filter(s => new Date(s.started_at) > yesterday) || [];
      const recentRush = rushRuns?.filter(r => new Date(r.started_at) > yesterday) || [];
      const recentUsers = new Set([
        ...recentSessions.filter(s => s.user_id).map(s => s.user_id),
        ...recentRush.filter(r => r.user_id).map(r => r.user_id)
      ]);

      setStats({
        chainSessions: sessions?.length || 0,
        chainCompleted: completed.length,
        chainWinRate: completed.length > 0 ? (won.length / completed.length) * 100 : 0,
        chainAvgMoves: won.length > 0 ? totalMoves / won.length : 0,
        chainAvgHints: sessions?.length > 0 ? totalHints / sessions.length : 0,
        rushRuns: rushRuns?.length || 0,
        rushCompleted: rushCompleted.length,
        rushAvgScore,
        rushMaxScore,
        rushHardModeRuns: rushHardMode.length,
        prismFeedback: prismData?.length || 0,
        prismAvgRating,
        totalUsers: allUsers.size,
        totalGamesPlayed: (sessions?.length || 0) + (rushRuns?.length || 0),
        dailyActiveUsers: recentUsers.size,
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

  const exportData = async () => {
    try {
      const reportData = {
        generatedAt: new Date().toISOString(),
        summary: stats,
        rawData: {
          note: "Complete data export available via backend query"
        }
      };

      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `morph-analytics-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Report exported",
        description: "Analytics data has been downloaded",
      });
    } catch (error: any) {
      toast({
        title: "Export failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Comprehensive Analytics</h1>
          <p className="text-muted-foreground">Complete snapshot of all game activity</p>
        </div>
        <Button onClick={exportData} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Overall Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.dailyActiveUsers} active today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Games</CardTitle>
            <Gamepad2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalGamesPlayed}</div>
            <p className="text-xs text-muted-foreground">
              Across all variants
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rush High Score</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rushMaxScore.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Avg: {stats.rushAvgScore.toFixed(0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prism Feedback</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.prismFeedback}</div>
            <p className="text-xs text-muted-foreground">
              {stats.prismAvgRating > 0 ? `Avg rating: ${stats.prismAvgRating.toFixed(1)}` : 'No ratings yet'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Game Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Game Activity Comparison</CardTitle>
          <CardDescription>Sessions started vs completed across games</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Morph Chain - Sessions</span>
                <span className="text-sm text-muted-foreground">{stats.chainSessions}</span>
              </div>
              <Progress value={(stats.chainSessions / stats.totalGamesPlayed) * 100} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Morph Chain - Completed</span>
                <span className="text-sm text-muted-foreground">{stats.chainCompleted}</span>
              </div>
              <Progress value={(stats.chainCompleted / stats.totalGamesPlayed) * 100} className="bg-secondary" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Morph Rush - Sessions</span>
                <span className="text-sm text-muted-foreground">{stats.rushRuns}</span>
              </div>
              <Progress value={(stats.rushRuns / stats.totalGamesPlayed) * 100} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Morph Rush - Completed</span>
                <span className="text-sm text-muted-foreground">{stats.rushCompleted}</span>
              </div>
              <Progress value={(stats.rushCompleted / stats.totalGamesPlayed) * 100} className="bg-secondary" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Game Stats */}
      <Tabs defaultValue="chain" className="space-y-4">
        <TabsList>
          <TabsTrigger value="chain">Morph Chain</TabsTrigger>
          <TabsTrigger value="rush">Morph Rush</TabsTrigger>
          <TabsTrigger value="prism">Morph Prism</TabsTrigger>
        </TabsList>

        <TabsContent value="chain" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.chainSessions}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.chainCompleted} completed
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.chainWinRate.toFixed(1)}%</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg Moves</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.chainAvgMoves.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">Per win</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg Hints</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.chainAvgHints.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Per session</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rush" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.rushRuns}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.rushCompleted} finished
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.rushAvgScore.toFixed(0)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">High Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.rushMaxScore.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Hard Mode</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.rushHardModeRuns}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.rushRuns > 0 ? `${((stats.rushHardModeRuns / stats.rushRuns) * 100).toFixed(1)}%` : '0%'}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="prism" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.prismFeedback}</div>
                <p className="text-xs text-muted-foreground">
                  Submissions received
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.prismAvgRating > 0 ? stats.prismAvgRating.toFixed(1) : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.prismAvgRating > 0 ? 'Out of 5' : 'No ratings yet'}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
