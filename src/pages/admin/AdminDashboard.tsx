import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Calendar, Database, Users } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalPuzzles: 0,
    livePuzzles: 0,
    totalSessions: 0,
    dictionarySize: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Get puzzle counts
      const { count: totalPuzzles } = await supabase
        .from("admin_puzzles")
        .select("*", { count: "exact", head: true });

      const { count: livePuzzles } = await supabase
        .from("admin_puzzles")
        .select("*", { count: "exact", head: true })
        .eq("status", "live");

      // Get session count
      const { count: totalSessions } = await supabase
        .from("player_sessions")
        .select("*", { count: "exact", head: true });

      // Get dictionary size
      const { count: dictionarySize } = await supabase
        .from("admin_dictionary")
        .select("*", { count: "exact", head: true });

      setStats({
        totalPuzzles: totalPuzzles || 0,
        livePuzzles: livePuzzles || 0,
        totalSessions: totalSessions || 0,
        dictionarySize: dictionarySize || 0,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const statCards = [
    {
      title: "Total Puzzles",
      value: stats.totalPuzzles,
      description: `${stats.livePuzzles} currently live`,
      icon: Calendar,
    },
    {
      title: "Player Sessions",
      value: stats.totalSessions,
      description: "All-time gameplay sessions",
      icon: Users,
    },
    {
      title: "Dictionary Size",
      value: stats.dictionarySize,
      description: "Managed words",
      icon: Database,
    },
    {
      title: "System Status",
      value: "Operational",
      description: "All systems running",
      icon: Activity,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Manage Morph Chain puzzles, dictionary, and monitor gameplay
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common admin tasks and management tools
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-2 hover:border-primary cursor-pointer transition-colors">
              <CardHeader>
                <CardTitle className="text-lg">View Today's Puzzle</CardTitle>
                <CardDescription>
                  Check current puzzle status and player progress
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-2 hover:border-primary cursor-pointer transition-colors">
              <CardHeader>
                <CardTitle className="text-lg">Schedule Puzzles</CardTitle>
                <CardDescription>
                  Plan upcoming puzzles and manage the calendar
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
