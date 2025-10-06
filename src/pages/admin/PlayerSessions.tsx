import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle, XCircle, Clock } from "lucide-react";

export default function PlayerSessions() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from("player_sessions")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setSessions(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching sessions",
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
        <h1 className="text-3xl font-bold">Player Sessions</h1>
        <p className="text-muted-foreground">Recent gameplay sessions and statistics</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sessions.filter((s) => s.completed).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sessions.filter((s) => s.completed).length > 0
                ? Math.round(
                    (sessions.filter((s) => s.won).length /
                      sessions.filter((s) => s.completed).length) *
                      100
                  )
                : 0}
              %
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Puzzle Date</TableHead>
                <TableHead>Length</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Moves</TableHead>
                <TableHead>Hints</TableHead>
                <TableHead>Invalid Guesses</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell className="text-sm">
                    {format(new Date(session.started_at), "MMM d, HH:mm")}
                  </TableCell>
                  <TableCell>{session.puzzle_date}</TableCell>
                  <TableCell>{session.word_length}L</TableCell>
                  <TableCell>
                    {session.completed ? (
                      session.won ? (
                        <Badge className="gap-1" variant="default">
                          <CheckCircle className="h-3 w-3" />
                          Won
                        </Badge>
                      ) : (
                        <Badge className="gap-1" variant="destructive">
                          <XCircle className="h-3 w-3" />
                          Lost
                        </Badge>
                      )
                    ) : (
                      <Badge className="gap-1" variant="secondary">
                        <Clock className="h-3 w-3" />
                        In Progress
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {Array.isArray(session.moves) ? session.moves.length : 0}
                  </TableCell>
                  <TableCell>{session.hints_used || 0}</TableCell>
                  <TableCell>{session.invalid_guesses || 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
