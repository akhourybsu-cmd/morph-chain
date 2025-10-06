import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Plus } from "lucide-react";
import { format, addDays } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { Badge } from "@/components/ui/badge";

export default function Scheduler() {
  const [puzzles, setPuzzles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchScheduledPuzzles();
  }, []);

  const fetchScheduledPuzzles = async () => {
    try {
      const today = format(toZonedTime(new Date(), "America/New_York"), "yyyy-MM-dd");
      const futureDate = format(addDays(new Date(today), 90), "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("admin_puzzles")
        .select("*")
        .gte("scheduled_date", today)
        .lte("scheduled_date", futureDate)
        .order("scheduled_date", { ascending: true });

      if (error) throw error;
      setPuzzles(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching schedule",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const groupByLength = (puzzles: any[]) => {
    return puzzles.reduce((acc, puzzle) => {
      const length = puzzle.word_length;
      if (!acc[length]) acc[length] = [];
      acc[length].push(puzzle);
      return acc;
    }, {} as Record<number, any[]>);
  };

  const grouped = groupByLength(puzzles);

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Puzzle Scheduler</h1>
          <p className="text-muted-foreground">Next 90 days of scheduled puzzles</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Schedule Puzzle
        </Button>
      </div>

      <div className="grid gap-6">
        {[4, 5, 6].map((length) => (
          <Card key={length}>
            <CardHeader>
              <CardTitle>{length}-Letter Puzzles</CardTitle>
              <CardDescription>
                {grouped[length]?.length || 0} puzzles scheduled
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {grouped[length]?.map((puzzle) => (
                  <div
                    key={puzzle.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {format(new Date(puzzle.scheduled_date), "MMM d, yyyy")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {puzzle.start_word.toUpperCase()} → {puzzle.goal_word.toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={puzzle.status === "live" ? "default" : "secondary"}>
                        {puzzle.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {puzzle.min_distance} moves
                      </span>
                    </div>
                  </div>
                ))}
                {(!grouped[length] || grouped[length].length === 0) && (
                  <p className="text-center text-muted-foreground py-8">
                    No puzzles scheduled
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
