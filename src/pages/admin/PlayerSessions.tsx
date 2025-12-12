import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle, XCircle, Clock, Gamepad2, Users, User, RefreshCw, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ActiveSession {
  id: string;
  device_token: string;
  game_type: string;
  puzzle_date: string;
  word_length: number | null;
  mode: string | null;
  moves_count: number;
  started_at: string;
  last_activity_at: string;
  completed: boolean;
  won: boolean;
  user_id: string | null;
}

export default function PlayerSessions() {
  const [chainSessions, setChainSessions] = useState<any[]>([]);
  const [rushSessions, setRushSessions] = useState<any[]>([]);
  const [gridSessions, setGridSessions] = useState<any[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAllSessions();
  }, []);

  const fetchAllSessions = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchGameSessions(),
        fetchActiveSessions(),
      ]);
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

  const fetchGameSessions = async () => {
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
  };

  const fetchActiveSessions = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from("active_sessions")
      .select("*")
      .eq("puzzle_date", today)
      .order("last_activity_at", { ascending: false });
    
    if (error) throw error;
    setActiveSessions(data || []);
  };

  const refreshActiveSessions = async () => {
    setRefreshing(true);
    try {
      await fetchActiveSessions();
    } finally {
      setRefreshing(false);
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

  const getActivityStatus = (lastActivity: string) => {
    const diff = Date.now() - new Date(lastActivity).getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 5) {
      return <Badge className="gap-1 bg-green-500"><Activity className="h-3 w-3" />Active</Badge>;
    }
    if (minutes < 30) {
      return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" />Idle</Badge>;
    }
    return <Badge variant="outline" className="gap-1 text-muted-foreground">Inactive</Badge>;
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading sessions...</div>;
  }

  const totalSessions = chainSessions.length + rushSessions.length + gridSessions.length;
  
  // Active session stats
  const activeNow = activeSessions.filter(s => {
    const diff = Date.now() - new Date(s.last_activity_at).getTime();
    return diff < 5 * 60 * 1000; // Active in last 5 minutes
  });
  const guestSessions = activeSessions.filter(s => !s.user_id);
  const completedToday = activeSessions.filter(s => s.completed);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Player Sessions</h1>
        <p className="text-muted-foreground">Recent gameplay sessions across all games</p>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active" className="gap-1">
            <Activity className="h-4 w-4" />
            Active Today ({activeSessions.length})
          </TabsTrigger>
          <TabsTrigger value="chain">Chain ({chainSessions.length})</TabsTrigger>
          <TabsTrigger value="rush">Rush ({rushSessions.length})</TabsTrigger>
          <TabsTrigger value="grid">Grid ({gridSessions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <div className="grid gap-4 md:grid-cols-4 mb-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4 text-green-500" />
                  Active Now
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeNow.length}</div>
                <p className="text-xs text-muted-foreground">Last 5 minutes</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Total Today
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeSessions.length}</div>
                <p className="text-xs text-muted-foreground">All sessions started today</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Guests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{guestSessions.length}</div>
                <p className="text-xs text-muted-foreground">
                  {activeSessions.length - guestSessions.length} authenticated
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedToday.length}</div>
                <p className="text-xs text-muted-foreground">
                  {completedToday.filter(s => s.won).length} won
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Today's Sessions</CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshActiveSessions}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {activeSessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Gamepad2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No sessions today yet</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Game</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>User Type</TableHead>
                      <TableHead>Moves</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Last Activity</TableHead>
                      <TableHead>Result</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeSessions.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell>{getActivityStatus(session.last_activity_at)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {session.game_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {session.word_length && `${session.word_length}L`}
                          {session.mode && session.mode}
                        </TableCell>
                        <TableCell>
                          {session.user_id ? (
                            <Badge variant="secondary" className="gap-1">
                              <User className="h-3 w-3" />
                              User
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1">
                              <Users className="h-3 w-3" />
                              Guest
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{session.moves_count}</TableCell>
                        <TableCell className="text-sm">
                          {format(new Date(session.started_at), "HH:mm")}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(session.last_activity_at), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          {session.completed ? (
                            session.won ? (
                              <Badge className="bg-green-500">Won</Badge>
                            ) : (
                              <Badge variant="destructive">Lost</Badge>
                            )
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chain">
          <Card>
            <CardHeader>
              <CardTitle>Chain Sessions (Authenticated Users)</CardTitle>
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
              <CardTitle>Rush Sessions (Authenticated Users)</CardTitle>
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
              <CardTitle>Grid Sessions (Authenticated Users)</CardTitle>
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
