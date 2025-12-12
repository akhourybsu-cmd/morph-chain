import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Clock, Gamepad2, Users, User, RefreshCw, Activity, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

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

interface SessionCardProps {
  session: ActiveSession;
}

// Mobile-friendly session card component
function SessionCard({ session }: SessionCardProps) {
  const getActivityStatus = (lastActivity: string) => {
    const diff = Date.now() - new Date(lastActivity).getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 5) return { label: "Active", color: "bg-green-500" };
    if (minutes < 30) return { label: "Idle", color: "bg-yellow-500" };
    return { label: "Inactive", color: "bg-muted" };
  };

  const status = getActivityStatus(session.last_activity_at);

  return (
    <div className="border rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${status.color}`} />
          <Badge variant="outline" className="capitalize text-xs">
            {session.game_type}
          </Badge>
          {session.word_length && (
            <span className="text-xs text-muted-foreground">{session.word_length}L</span>
          )}
          {session.mode && (
            <span className="text-xs text-muted-foreground">{session.mode}</span>
          )}
        </div>
        <Badge variant={session.user_id ? "secondary" : "outline"} className="text-xs">
          {session.user_id ? "User" : "Guest"}
        </Badge>
      </div>
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-3 text-muted-foreground">
          <span>{session.moves_count} moves</span>
          <span>{format(new Date(session.started_at), "HH:mm")}</span>
        </div>
        {session.completed ? (
          <Badge className={session.won ? "bg-green-500" : ""} variant={session.won ? "default" : "destructive"}>
            {session.won ? "Won" : "Lost"}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(session.last_activity_at), { addSuffix: true })}
          </span>
        )}
      </div>
    </div>
  );
}

// Mobile-friendly game session card
function GameSessionCard({ session, type }: { session: any; type: 'chain' | 'rush' | 'grid' }) {
  const getStatusBadge = (completed: boolean, won: boolean) => {
    if (!completed) return { label: "In Progress", variant: "secondary" as const };
    if (won) return { label: "Won", variant: "default" as const, className: "bg-green-500" };
    return { label: "Lost", variant: "destructive" as const };
  };

  if (type === 'chain') {
    const status = getStatusBadge(session.completed, session.won);
    return (
      <div className="border rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{session.puzzle_date}</span>
          <Badge variant="outline">{session.word_length}L</Badge>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-3 text-muted-foreground">
            <span>{Array.isArray(session.moves) ? session.moves.length : 0} moves</span>
            <span>{session.hints_used || 0} hints</span>
          </div>
          <Badge variant={status.variant} className={status.className}>{status.label}</Badge>
        </div>
      </div>
    );
  }

  if (type === 'rush') {
    return (
      <div className="border rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{format(new Date(session.started_at), "MMM d")}</span>
          <Badge variant="outline">{session.mode}</Badge>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-3 text-muted-foreground">
            <span className="font-semibold text-foreground">{session.score} pts</span>
            <span>{Array.isArray(session.words) ? session.words.length : 0} words</span>
          </div>
          <span className="font-mono text-xs">{session.initials || "—"}</span>
        </div>
      </div>
    );
  }

  // Grid
  const status = getStatusBadge(session.completed, session.won);
  return (
    <div className="border rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{session.date_local}</span>
        <Badge variant={status.variant} className={status.className}>{status.label}</Badge>
      </div>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{session.moves} moves • {session.words_used} words</span>
        <span>
          {session.time_to_complete_ms 
            ? `${Math.floor(session.time_to_complete_ms / 60000)}:${String(Math.floor((session.time_to_complete_ms % 60000) / 1000)).padStart(2, '0')}`
            : "—"
          }
        </span>
      </div>
    </div>
  );
}

export default function PlayerSessions() {
  const [chainSessions, setChainSessions] = useState<any[]>([]);
  const [rushSessions, setRushSessions] = useState<any[]>([]);
  const [gridSessions, setGridSessions] = useState<any[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [allTimeSessions, setAllTimeSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [backdating, setBackdating] = useState(false);
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
        fetchAllTimeSessions(),
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
    const [chainRes, rushRes, gridRes] = await Promise.all([
      supabase.from("player_sessions").select("*").order("started_at", { ascending: false }).limit(100),
      supabase.from("rush_runs").select("*").order("started_at", { ascending: false }).limit(100),
      supabase.from("grid_sessions").select("*").order("started_at", { ascending: false }).limit(100),
    ]);
    
    if (chainRes.error) throw chainRes.error;
    if (rushRes.error) throw rushRes.error;
    if (gridRes.error) throw gridRes.error;
    
    setChainSessions(chainRes.data || []);
    setRushSessions(rushRes.data || []);
    setGridSessions(gridRes.data || []);
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

  const fetchAllTimeSessions = async () => {
    const { data, error } = await supabase
      .from("active_sessions")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(500);
    
    if (error) throw error;
    setAllTimeSessions(data || []);
  };

  const backdateHistoricalSessions = async () => {
    setBackdating(true);
    try {
      let inserted = 0;

      // Backdate Chain sessions
      for (const session of chainSessions) {
        const { error } = await supabase.from("active_sessions").upsert({
          device_token: `backfill-${session.user_id}`,
          game_type: 'chain',
          puzzle_date: session.puzzle_date,
          word_length: session.word_length,
          mode: null,
          moves_count: Array.isArray(session.moves) ? session.moves.length : 0,
          started_at: session.started_at,
          last_activity_at: session.completed_at || session.started_at,
          completed: session.completed ?? false,
          won: session.won ?? false,
          user_id: session.user_id,
        }, { onConflict: 'device_token,game_type,puzzle_date' });
        
        if (!error) inserted++;
      }

      // Backdate Rush sessions
      for (const session of rushSessions) {
        const { error } = await supabase.from("active_sessions").upsert({
          device_token: `backfill-${session.user_id}`,
          game_type: 'rush',
          puzzle_date: session.date_local,
          word_length: null,
          mode: session.mode,
          moves_count: Array.isArray(session.words) ? session.words.length : 0,
          started_at: session.started_at,
          last_activity_at: session.finished_at || session.started_at,
          completed: !!session.finished_at,
          won: session.score > 0,
          user_id: session.user_id,
        }, { onConflict: 'device_token,game_type,puzzle_date' });
        
        if (!error) inserted++;
      }

      // Backdate Grid sessions
      for (const session of gridSessions) {
        const { error } = await supabase.from("active_sessions").upsert({
          device_token: `backfill-${session.user_id}`,
          game_type: 'grid',
          puzzle_date: session.date_local,
          word_length: null,
          mode: null,
          moves_count: session.moves || 0,
          started_at: session.started_at,
          last_activity_at: session.completed_at || session.started_at,
          completed: session.completed ?? false,
          won: session.won ?? false,
          user_id: session.user_id,
        }, { onConflict: 'device_token,game_type,puzzle_date' });
        
        if (!error) inserted++;
      }

      toast({
        title: "Backdate complete",
        description: `Processed ${inserted} historical sessions`,
      });

      await fetchAllTimeSessions();
    } catch (error: any) {
      toast({
        title: "Error backdating",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setBackdating(false);
    }
  };

  const refreshActiveSessions = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchActiveSessions(), fetchAllTimeSessions()]);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading sessions...</div>;
  }

  // Active session stats
  const activeNow = activeSessions.filter(s => {
    const diff = Date.now() - new Date(s.last_activity_at).getTime();
    return diff < 5 * 60 * 1000;
  });
  const guestSessions = activeSessions.filter(s => !s.user_id);
  const completedToday = activeSessions.filter(s => s.completed);

  // All-time stats
  const uniqueDates = new Set(allTimeSessions.map(s => s.puzzle_date));
  const totalGuests = allTimeSessions.filter(s => !s.user_id).length;

  return (
    <div className="space-y-4 px-2 md:px-0">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Player Sessions</h1>
        <p className="text-sm text-muted-foreground">Track all gameplay sessions</p>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <ScrollArea className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="active" className="text-xs md:text-sm">
              <Activity className="h-3 w-3 md:h-4 md:w-4 mr-1" />
              Today ({activeSessions.length})
            </TabsTrigger>
            <TabsTrigger value="all" className="text-xs md:text-sm">
              <Database className="h-3 w-3 md:h-4 md:w-4 mr-1" />
              All ({allTimeSessions.length})
            </TabsTrigger>
            <TabsTrigger value="chain" className="text-xs md:text-sm">Chain</TabsTrigger>
            <TabsTrigger value="rush" className="text-xs md:text-sm">Rush</TabsTrigger>
            <TabsTrigger value="grid" className="text-xs md:text-sm">Grid</TabsTrigger>
          </TabsList>
        </ScrollArea>

        <TabsContent value="active">
          {/* Stats Grid - 2x2 on mobile, 4 on desktop */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-4">
            <Card className="p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Activity className="h-3 w-3 text-green-500" />
                Active Now
              </div>
              <div className="text-xl font-bold">{activeNow.length}</div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Users className="h-3 w-3" />
                Total Today
              </div>
              <div className="text-xl font-bold">{activeSessions.length}</div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <User className="h-3 w-3" />
                Guests
              </div>
              <div className="text-xl font-bold">{guestSessions.length}</div>
            </Card>
            <Card className="p-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                Completed
              </div>
              <div className="text-xl font-bold">{completedToday.length}</div>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-3">
              <CardTitle className="text-base">Today's Sessions</CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshActiveSessions}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              {activeSessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Gamepad2 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No sessions today yet</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {activeSessions.map((session) => (
                    <SessionCard key={session.id} session={session} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          {/* All-time stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-4">
            <Card className="p-3">
              <div className="text-xs text-muted-foreground mb-1">Total Sessions</div>
              <div className="text-xl font-bold">{allTimeSessions.length}</div>
            </Card>
            <Card className="p-3">
              <div className="text-xs text-muted-foreground mb-1">Days Tracked</div>
              <div className="text-xl font-bold">{uniqueDates.size}</div>
            </Card>
            <Card className="p-3">
              <div className="text-xs text-muted-foreground mb-1">Guest Sessions</div>
              <div className="text-xl font-bold">{totalGuests}</div>
            </Card>
            <Card className="p-3">
              <div className="text-xs text-muted-foreground mb-1">Completion Rate</div>
              <div className="text-xl font-bold">
                {allTimeSessions.length > 0 
                  ? Math.round((allTimeSessions.filter(s => s.completed).length / allTimeSessions.length) * 100)
                  : 0}%
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-3">
              <CardTitle className="text-base">All Sessions</CardTitle>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={backdateHistoricalSessions}
                  disabled={backdating}
                >
                  <Database className={`h-4 w-4 mr-1 ${backdating ? 'animate-pulse' : ''}`} />
                  {backdating ? "..." : "Backfill"}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={refreshActiveSessions}
                  disabled={refreshing}
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              {allTimeSessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Database className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No sessions tracked yet</p>
                  <p className="text-xs mt-1">Click "Backfill" to import historical data</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {allTimeSessions.map((session) => (
                    <SessionCard key={session.id} session={session} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chain">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-base">Chain Sessions</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              {chainSessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Gamepad2 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No Chain sessions found</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {chainSessions.map((session) => (
                    <GameSessionCard key={session.id} session={session} type="chain" />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rush">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-base">Rush Sessions</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              {rushSessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Gamepad2 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No Rush sessions found</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {rushSessions.map((session) => (
                    <GameSessionCard key={session.id} session={session} type="rush" />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grid">
          <Card>
            <CardHeader className="py-3">
              <CardTitle className="text-base">Grid Sessions</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              {gridSessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Gamepad2 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No Grid sessions found</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {gridSessions.map((session) => (
                    <GameSessionCard key={session.id} session={session} type="grid" />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
