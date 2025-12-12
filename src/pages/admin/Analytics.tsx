import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, Users, Target, Download, Gamepad2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

interface AnalyticsData {
  // Morph Chain Stats
  chain4L_completed: number;
  chain4L_won: number;
  chain4L_uniqueCompleters: number;
  chain4L_avgMoves: number;
  chain5L_completed: number;
  chain5L_won: number;
  chain5L_uniqueCompleters: number;
  chain5L_avgMoves: number;
  
  // Morph Rush Stats
  rushDaily_runs: number;
  rushDaily_completed: number;
  rushDaily_uniquePlayers: number;
  rushDaily_avgScore: number;
  
  // Morph Grid Stats
  gridTotalCompletions: number;
  gridUniqueCompleters: number;
  gridAvgMoves: number;
  gridBestMoves: number;
  gridAvgTime: number;
  
  // Overall Stats
  totalUsers: number;
  totalGamesPlayed: number;
  totalGamesCompleted: number;
  dailyActiveUsers: number;
}

export default function Analytics() {
  const [stats, setStats] = useState<AnalyticsData>({
    chain4L_completed: 0,
    chain4L_won: 0,
    chain4L_uniqueCompleters: 0,
    chain4L_avgMoves: 0,
    chain5L_completed: 0,
    chain5L_won: 0,
    chain5L_uniqueCompleters: 0,
    chain5L_avgMoves: 0,
    rushDaily_runs: 0,
    rushDaily_completed: 0,
    rushDaily_uniquePlayers: 0,
    rushDaily_avgScore: 0,
    gridTotalCompletions: 0,
    gridUniqueCompleters: 0,
    gridAvgMoves: 0,
    gridBestMoves: 0,
    gridAvgTime: 0,
    totalUsers: 0,
    totalGamesPlayed: 0,
    totalGamesCompleted: 0,
    dailyActiveUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Fetch Chain completions
      const { data: chainData, error: chainError } = await supabase
        .from("v_chain_completions")
        .select("*");
      if (chainError) throw chainError;

      // Fetch Rush completions
      const { data: rushData, error: rushError } = await supabase
        .from("v_rush_completions")
        .select("*");
      if (rushError) throw rushError;

      // Fetch Grid completions
      const { data: gridData, error: gridError } = await supabase
        .from("v_grid_completions")
        .select("*")
        .maybeSingle();
      if (gridError) throw gridError;

      // Fetch overall activity
      const { data: overallData, error: overallError } = await supabase
        .from("v_overall_activity")
        .select("*");
      if (overallError) throw overallError;

      // Fetch user engagement
      const { data: engagementData, error: engagementError } = await supabase
        .from("v_user_engagement")
        .select("*");
      if (engagementError) throw engagementError;

      // Process Chain data
      const chain4L: any = chainData?.find((c: any) => c.word_length === 4);
      const chain5L: any = chainData?.find((c: any) => c.word_length === 5);

      // Process Rush data (daily mode only, no hard mode)
      const rushDaily: any = rushData?.find((r: any) => r.mode === 'daily' && r.hard_mode === false);

      // Calculate totals
      const totalGamesPlayed = overallData?.reduce((sum: number, game: any) => sum + (game.sessions_started || 0), 0) || 0;
      const totalGamesCompleted = overallData?.reduce((sum: number, game: any) => sum + (game.sessions_completed || 0), 0) || 0;

      // Calculate DAU
      const today = new Date().toISOString().split('T')[0];
      const activeToday = engagementData?.filter((e: any) => e.last_active_date === today).length || 0;

      setStats({
        chain4L_completed: chain4L?.total_completed || 0,
        chain4L_won: chain4L?.total_won || 0,
        chain4L_uniqueCompleters: chain4L?.unique_completers || 0,
        chain4L_avgMoves: chain4L?.avg_moves_to_win || 0,
        chain5L_completed: chain5L?.total_completed || 0,
        chain5L_won: chain5L?.total_won || 0,
        chain5L_uniqueCompleters: chain5L?.unique_completers || 0,
        chain5L_avgMoves: chain5L?.avg_moves_to_win || 0,
        rushDaily_runs: rushDaily?.total_runs || 0,
        rushDaily_completed: rushDaily?.total_completed || 0,
        rushDaily_uniquePlayers: rushDaily?.unique_players || 0,
        rushDaily_avgScore: rushDaily?.avg_score || 0,
        gridTotalCompletions: gridData?.total_completions || 0,
        gridUniqueCompleters: gridData?.unique_completers || 0,
        gridAvgMoves: gridData?.avg_moves || 0,
        gridBestMoves: gridData?.best_moves || 0,
        gridAvgTime: gridData?.avg_time_seconds || 0,
        totalUsers: engagementData?.length || 0,
        totalGamesPlayed,
        totalGamesCompleted,
        dailyActiveUsers: activeToday,
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
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Game activity and player statistics</p>
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
            <p className="text-xs text-muted-foreground">Across all games</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Games</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalGamesCompleted}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalGamesPlayed > 0 
                ? `${Math.round((stats.totalGamesCompleted / stats.totalGamesPlayed) * 100)}% completion rate`
                : "No games yet"
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Active</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.dailyActiveUsers}</div>
            <p className="text-xs text-muted-foreground">Users today</p>
          </CardContent>
        </Card>
      </div>

      {/* Game Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Game Activity Comparison</CardTitle>
          <CardDescription>Completions across all game modes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Morph Chain - 4L</span>
                <span className="text-sm text-muted-foreground">{stats.chain4L_completed} completions</span>
              </div>
              <Progress value={(stats.chain4L_completed / Math.max(stats.totalGamesCompleted, 1)) * 100} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Morph Chain - 5L</span>
                <span className="text-sm text-muted-foreground">{stats.chain5L_completed} completions</span>
              </div>
              <Progress value={(stats.chain5L_completed / Math.max(stats.totalGamesCompleted, 1)) * 100} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Morph Rush</span>
                <span className="text-sm text-muted-foreground">{stats.rushDaily_completed} completions</span>
              </div>
              <Progress value={(stats.rushDaily_completed / Math.max(stats.totalGamesCompleted, 1)) * 100} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Morph Grid</span>
                <span className="text-sm text-muted-foreground">{stats.gridTotalCompletions} completions</span>
              </div>
              <Progress value={(stats.gridTotalCompletions / Math.max(stats.totalGamesCompleted, 1)) * 100} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Game Stats */}
      <Tabs defaultValue="chain" className="space-y-4">
        <TabsList>
          <TabsTrigger value="chain">Morph Chain</TabsTrigger>
          <TabsTrigger value="rush">Morph Rush</TabsTrigger>
          <TabsTrigger value="grid">Morph Grid</TabsTrigger>
        </TabsList>

        <TabsContent value="chain" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">4L Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.chain4L_completed}</div>
                <p className="text-xs text-muted-foreground">{stats.chain4L_won} won</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">5L Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.chain5L_completed}</div>
                <p className="text-xs text-muted-foreground">{stats.chain5L_won} won</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">4L Avg Moves</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.chain4L_avgMoves.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">Per win</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">5L Avg Moves</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.chain5L_avgMoves.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">Per win</p>
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
                <div className="text-2xl font-bold">{stats.rushDaily_runs}</div>
                <p className="text-xs text-muted-foreground">{stats.rushDaily_completed} finished</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.rushDaily_avgScore.toFixed(0)}</div>
                <p className="text-xs text-muted-foreground">Points per run</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Unique Players</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.rushDaily_uniquePlayers}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.rushDaily_runs > 0 
                    ? `${Math.round((stats.rushDaily_completed / stats.rushDaily_runs) * 100)}%`
                    : "0%"
                  }
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="grid" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Completions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.gridTotalCompletions}</div>
                <p className="text-xs text-muted-foreground">{stats.gridUniqueCompleters} unique players</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg Moves</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.gridAvgMoves.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">Per completion</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Best Moves</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.gridBestMoves}</div>
                <p className="text-xs text-muted-foreground">Record</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.gridAvgTime > 0 
                    ? `${Math.floor(stats.gridAvgTime / 60)}:${String(Math.floor(stats.gridAvgTime % 60)).padStart(2, '0')}`
                    : "—"
                  }
                </div>
                <p className="text-xs text-muted-foreground">Per completion</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}