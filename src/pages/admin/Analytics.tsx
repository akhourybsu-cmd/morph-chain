import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, Users, Target, Zap, Download, Gamepad2, Trophy, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

interface AnalyticsData {
  // Morph Chain Stats - by word length
  chain4L_completed: number;
  chain4L_won: number;
  chain4L_uniqueCompleters: number;
  chain4L_avgMoves: number;
  chain5L_completed: number;
  chain5L_won: number;
  chain5L_uniqueCompleters: number;
  chain5L_avgMoves: number;
  
  // Morph Rush Stats - by mode
  rushDaily_runs: number;
  rushDaily_completed: number;
  rushDaily_uniquePlayers: number;
  rushDaily_avgScore: number;
  rushDailyHard_runs: number;
  rushDailyHard_completed: number;
  
  // Morph Grid Stats
  gridTotalCompletions: number;
  gridUniqueCompleters: number;
  gridAvgMoves: number;
  gridBestMoves: number;
  
  // Morph Arcade Stats
  arcadeTotalCompletions: number;
  arcadeUniqueCompleters: number;
  arcadeAvgMoves: number;
  
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
    rushDailyHard_runs: 0,
    rushDailyHard_completed: 0,
    gridTotalCompletions: 0,
    gridUniqueCompleters: 0,
    gridAvgMoves: 0,
    gridBestMoves: 0,
    arcadeTotalCompletions: 0,
    arcadeUniqueCompleters: 0,
    arcadeAvgMoves: 0,
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
      // Fetch Chain completions by word length
      const { data: chainData, error: chainError } = await supabase
        .from("v_chain_completions")
        .select("*");
      if (chainError) throw chainError;

      // Fetch Rush completions by mode
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

      // Fetch Arcade completions
      const { data: arcadeData, error: arcadeError } = await supabase
        .from("v_arcade_completions")
        .select("*")
        .maybeSingle();
      if (arcadeError) throw arcadeError;

      // Fetch overall activity
      const { data: overallData, error: overallError } = await supabase
        .from("v_overall_activity")
        .select("*");
      if (overallError) throw overallError;

      // Fetch user engagement for DAU calculation
      const { data: engagementData, error: engagementError } = await supabase
        .from("v_user_engagement")
        .select("*");
      if (engagementError) throw engagementError;

      // Process Chain data with proper typing
      const chain4L: any = chainData?.find((c: any) => c.word_length === 4);
      const chain5L: any = chainData?.find((c: any) => c.word_length === 5);

      // Process Rush data with proper typing
      const rushDaily: any = rushData?.find((r: any) => r.mode === 'daily' && r.hard_mode === false);
      const rushDailyHard: any = rushData?.find((r: any) => r.mode === 'daily' && r.hard_mode === true);

      // Calculate totals from overall activity
      const totalGamesPlayed = overallData?.reduce((sum: number, game: any) => sum + (game.sessions_started || 0), 0) || 0;
      const totalGamesCompleted = overallData?.reduce((sum: number, game: any) => sum + (game.sessions_completed || 0), 0) || 0;
      const allUniqueUsers = new Set(overallData?.flatMap((game: any) => game.unique_users || []));

      // Calculate DAU (users active today)
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
        rushDailyHard_runs: rushDailyHard?.total_runs || 0,
        rushDailyHard_completed: rushDailyHard?.total_completed || 0,
        gridTotalCompletions: gridData?.total_completions || 0,
        gridUniqueCompleters: gridData?.unique_completers || 0,
        gridAvgMoves: gridData?.avg_moves || 0,
        gridBestMoves: gridData?.best_moves || 0,
        arcadeTotalCompletions: arcadeData?.total_completions || 0,
        arcadeUniqueCompleters: arcadeData?.unique_completers || 0,
        arcadeAvgMoves: arcadeData?.avg_moves || 0,
        totalUsers: allUniqueUsers.size,
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
            <CardTitle className="text-sm font-medium">Completed Games</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalGamesCompleted}</div>
            <p className="text-xs text-muted-foreground">
              Out of {stats.totalGamesPlayed} started
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Grid Completions</CardTitle>
            <Gamepad2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.gridTotalCompletions}</div>
            <p className="text-xs text-muted-foreground">
              {stats.gridUniqueCompleters} unique players
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
                <span className="text-sm font-medium">Morph Chain - 4L Completions</span>
                <span className="text-sm text-muted-foreground">{stats.chain4L_completed} ({stats.chain4L_uniqueCompleters} unique)</span>
              </div>
              <Progress value={(stats.chain4L_completed / Math.max(stats.totalGamesCompleted, 1)) * 100} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Morph Chain - 5L Completions</span>
                <span className="text-sm text-muted-foreground">{stats.chain5L_completed} ({stats.chain5L_uniqueCompleters} unique)</span>
              </div>
              <Progress value={(stats.chain5L_completed / Math.max(stats.totalGamesCompleted, 1)) * 100} className="bg-secondary" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Morph Rush - Daily Completions</span>
                <span className="text-sm text-muted-foreground">{stats.rushDaily_completed} ({stats.rushDaily_uniquePlayers} unique)</span>
              </div>
              <Progress value={(stats.rushDaily_completed / Math.max(stats.totalGamesCompleted, 1)) * 100} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Morph Grid - Completions</span>
                <span className="text-sm text-muted-foreground">{stats.gridTotalCompletions} ({stats.gridUniqueCompleters} unique)</span>
              </div>
              <Progress value={(stats.gridTotalCompletions / Math.max(stats.totalGamesCompleted, 1)) * 100} className="bg-secondary" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Morph Arcade - Completions</span>
                <span className="text-sm text-muted-foreground">{stats.arcadeTotalCompletions} ({stats.arcadeUniqueCompleters} unique)</span>
              </div>
              <Progress value={(stats.arcadeTotalCompletions / Math.max(stats.totalGamesCompleted, 1)) * 100} />
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
                <CardTitle className="text-sm font-medium">4L Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.chain4L_completed}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.chain4L_won} won
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">5L Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.chain5L_completed}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.chain5L_won} won
                </p>
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
                <CardTitle className="text-sm font-medium">Daily Runs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.rushDaily_runs}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.rushDaily_completed} finished
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Daily Avg Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.rushDaily_avgScore.toFixed(0)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Hard Mode Runs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.rushDailyHard_runs}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.rushDailyHard_completed} finished
                </p>
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
          </div>
        </TabsContent>

        <TabsContent value="prism" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Grid Completions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.gridTotalCompletions}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.gridUniqueCompleters} unique players
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Arcade Completions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.arcadeTotalCompletions}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.arcadeUniqueCompleters} unique players
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
