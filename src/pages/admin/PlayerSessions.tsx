import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle, XCircle, Clock, Gamepad2 } from "lucide-react";

export default function PlayerSessions() {
  const [chainSessions, setChainSessions] = useState<any[]>([]);
  const [rushSessions, setRushSessions] = useState<any[]>([]);
  const [gridSessions, setGridSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAllSessions();
  }, []);

  const fetchAllSessions = async () => {
    setLoading(true);
    try {
      // Fetch Chain sessions
      const { data: chainData, error: chainError } = await supabase
        .from("player_sessions")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(100);
      if (chainError) throw chainError;
      setChainSessions(chainData || []);

      // Fetch Rush sessions
      const { data: rushData, error: rushError } = await supabase
        .from("rush_runs")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(100);
      if (rushError) throw rushError;
      setRushSessions(rushData || []);

      // Fetch Grid sessions
      const { data: gridData, error: gridError } = await supabase
        .from("grid_sessions")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(100);
      if (gridError) throw gridError;
      setGridSessions(gridData || []);

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

  const getStatusBadge = (completed: boolean, won: boolean) => {
    if (!completed) {
      return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />In Progress</Badge>;
    }
    if (won) {
      return <Badge variant="default" className="gap-1 bg-green-500"><CheckCircle className="h-3 w-3" />Won</Badge>;
    }
    return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Lost</Badge>;
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading sessions...</div>;
  }

  const totalSessions = chainSessions.length + rushSessions.length + gridSessions.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Player Sessions</h1>
        <p className="text-muted-foreground">Recent gameplay sessions across all games</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSessions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Chain Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{chainSessions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Rush Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rushSessions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Grid Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gridSessions.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="chain" className="space-y-4">
        <TabsList>
          <TabsTrigger value="chain">Morph Chain ({chainSessions.length})</TabsTrigger>
          <TabsTrigger value="rush">Morph Rush ({rushSessions.length})</TabsTrigger>
          <TabsTrigger value="grid">Morph Grid ({gridSessions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="chain">
          <Card>
            <CardHeader>
              <CardTitle>Chain Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              {chainSessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Gamepad2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No Chain sessions found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Puzzle Date</TableHead>
                      <TableHead>Length</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Moves</TableHead>
                      <TableHead>Hints</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chainSessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell className="text-sm">
                          {format(new Date(session.started_at), "MMM d, HH:mm")}
                        </TableCell>
                        <TableCell>{session.puzzle_date}</TableCell>
                        <TableCell>{session.word_length}L</TableCell>
                        <TableCell>{getStatusBadge(session.completed, session.won)}</TableCell>
                        <TableCell>{Array.isArray(session.moves) ? session.moves.length : 0}</TableCell>
                        <TableCell>{session.hints_used || 0}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rush">
          <Card>
            <CardHeader>
              <CardTitle>Rush Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              {rushSessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Gamepad2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No Rush sessions found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Mode</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Words</TableHead>
                      <TableHead>Multiplier</TableHead>
                      <TableHead>Initials</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rushSessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell className="text-sm">
                          {format(new Date(session.started_at), "MMM d, HH:mm")}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{session.mode}</Badge>
                        </TableCell>
                        <TableCell className="font-semibold">{session.score}</TableCell>
                        <TableCell>{Array.isArray(session.words) ? session.words.length : 0}</TableCell>
                        <TableCell>{session.multiplier_max?.toFixed(1)}x</TableCell>
                        <TableCell className="font-mono">{session.initials || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grid">
          <Card>
            <CardHeader>
              <CardTitle>Grid Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              {gridSessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Gamepad2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No Grid sessions found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Puzzle Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Moves</TableHead>
                      <TableHead>Words</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gridSessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell className="text-sm">
                          {format(new Date(session.started_at), "MMM d, HH:mm")}
                        </TableCell>
                        <TableCell>{session.date_local}</TableCell>
                        <TableCell>{getStatusBadge(session.completed, session.won)}</TableCell>
                        <TableCell>{session.moves}</TableCell>
                        <TableCell>{session.words_used}</TableCell>
                        <TableCell>
                          {session.time_to_complete_ms 
                            ? `${Math.floor(session.time_to_complete_ms / 60000)}:${String(Math.floor((session.time_to_complete_ms % 60000) / 1000)).padStart(2, '0')}`
                            : "—"
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}