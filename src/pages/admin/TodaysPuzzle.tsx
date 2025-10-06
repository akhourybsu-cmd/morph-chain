import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Play, Lock, Unlock, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";

export default function TodaysPuzzle() {
  const [puzzle, setPuzzle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTodaysPuzzle();
  }, []);

  const fetchTodaysPuzzle = async () => {
    try {
      const today = format(toZonedTime(new Date(), "America/New_York"), "yyyy-MM-dd");
      
      const { data, error } = await supabase
        .from("admin_puzzles")
        .select("*")
        .eq("scheduled_date", today)
        .maybeSingle();

      if (error) throw error;
      setPuzzle(data);
    } catch (error: any) {
      toast({
        title: "Error fetching puzzle",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: "draft" | "preview" | "live" | "disabled" | "completed") => {
    if (!puzzle) return;

    try {
      const { error } = await supabase
        .from("admin_puzzles")
        .update({ status: newStatus })
        .eq("id", puzzle.id);

      if (error) throw error;

      toast({
        title: "Status updated",
        description: `Puzzle status changed to ${newStatus}`,
      });

      fetchTodaysPuzzle();
    } catch (error: any) {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  if (!puzzle) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Today's Puzzle</CardTitle>
          <CardDescription>No puzzle scheduled for today</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Please schedule a puzzle for today in the Scheduler.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Today's Puzzle</h1>
        <Badge variant={puzzle.status === "live" ? "default" : "secondary"}>
          {puzzle.status}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Puzzle #{puzzle.puzzle_index || "TBD"}</CardTitle>
          <CardDescription>
            {format(new Date(puzzle.scheduled_date), "MMMM d, yyyy")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Start Word</p>
              <p className="text-2xl font-bold uppercase">{puzzle.start_word}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Goal Word</p>
              <p className="text-2xl font-bold uppercase">{puzzle.goal_word}</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Word Length</p>
              <p className="text-xl font-semibold">{puzzle.word_length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Min Distance</p>
              <p className="text-xl font-semibold">{puzzle.min_distance}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Max Moves</p>
              <p className="text-xl font-semibold">{puzzle.max_moves}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Variant</p>
              <p className="text-xl font-semibold capitalize">{puzzle.variant.replace("_", " ")}</p>
            </div>
          </div>

          {puzzle.shortest_path_count && (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Shortest Paths</p>
                <p className="text-lg font-semibold">{puzzle.shortest_path_count}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Branching</p>
                <p className="text-lg font-semibold">{puzzle.avg_branching_factor?.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Health Score</p>
                <p className="text-lg font-semibold">{puzzle.health_score}</p>
              </div>
            </div>
          )}

          {puzzle.theme_tags && puzzle.theme_tags.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Theme Tags</p>
              <div className="flex gap-2 flex-wrap">
                {puzzle.theme_tags.map((tag: string) => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4 border-t">
            {puzzle.status === "preview" && (
              <Button onClick={() => updateStatus("live")} className="gap-2">
                <Play className="h-4 w-4" />
                Push Live
              </Button>
            )}
            {puzzle.status === "live" && (
              <Button onClick={() => updateStatus("disabled")} variant="destructive" className="gap-2">
                <Lock className="h-4 w-4" />
                End Early
              </Button>
            )}
            {puzzle.status === "disabled" && (
              <Button onClick={() => updateStatus("live")} className="gap-2">
                <Unlock className="h-4 w-4" />
                Re-enable
              </Button>
            )}
            <Button onClick={fetchTodaysPuzzle} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
