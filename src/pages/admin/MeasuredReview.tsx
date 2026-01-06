import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, RefreshCw, AlertTriangle, ArrowRight, Eye, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { type PuzzleSolution } from "@/lib/measured/puzzleGenerator";
import { logAuditAction } from "@/lib/measured/auditLog";

interface PuzzleWithFact {
  id: string;
  puzzle_date: string;
  fact_id: string;
  target_value_int: number;
  tiles: number[];
  solution: PuzzleSolution;
  difficulty: string;
  is_published: boolean;
  fact: {
    title: string;
    clue_text: string;
    reveal_blurb: string;
    category: string;
    unit_label: string;
  };
}

interface AuditEntry {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  reason: string | null;
  created_at: string;
  admin_user_id: string;
}

export default function MeasuredReview() {
  const [puzzles, setPuzzles] = useState<PuzzleWithFact[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [swapDialogOpen, setSwapDialogOpen] = useState(false);
  const [swapTarget, setSwapTarget] = useState<PuzzleWithFact | null>(null);
  const [swapReason, setSwapReason] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load puzzles with fact info
      const { data: puzzlesData, error: puzzlesError } = await supabase
        .from("measured_daily_puzzles")
        .select(`
          *,
          fact:measured_fact_bank(title, clue_text, reveal_blurb, category, unit_label)
        `)
        .gte("puzzle_date", format(new Date(), "yyyy-MM-dd"))
        .order("puzzle_date", { ascending: true });

      if (puzzlesError) throw puzzlesError;
      
      setPuzzles((puzzlesData || []).map(p => ({
        ...p,
        tiles: p.tiles as unknown as number[],
        solution: p.solution as unknown as PuzzleSolution,
        fact: p.fact as PuzzleWithFact["fact"],
      })));

      // Load recent audit log
      const { data: auditData, error: auditError } = await supabase
        .from("measured_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (auditError) throw auditError;
      setAuditLog((auditData || []) as AuditEntry[]);
    } catch (err) {
      console.error("Error loading data:", err);
      toast({ title: "Error loading data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (puzzle: PuzzleWithFact) => {
    setPublishing(puzzle.id);
    try {
      const { error } = await supabase
        .from("measured_daily_puzzles")
        .update({ is_published: true })
        .eq("id", puzzle.id);

      if (error) throw error;

      await logAuditAction({
        action: "publish_puzzle",
        entity_type: "puzzle",
        entity_id: puzzle.id,
        details: {
          date: puzzle.puzzle_date,
          fact_title: puzzle.fact.title,
          target: puzzle.target_value_int,
        },
      });

      toast({ title: `Puzzle for ${format(new Date(puzzle.puzzle_date), "MMM d")} published!` });
      loadData();
    } catch (err) {
      console.error("Publish error:", err);
      toast({ title: "Failed to publish", variant: "destructive" });
    } finally {
      setPublishing(null);
    }
  };

  const handleDelete = async (puzzle: PuzzleWithFact) => {
    if (puzzle.is_published) {
      toast({
        title: "Cannot delete published puzzle",
        description: "Use emergency swap instead.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("measured_daily_puzzles")
        .delete()
        .eq("id", puzzle.id);

      if (error) throw error;

      await logAuditAction({
        action: "generate_puzzle",
        entity_type: "puzzle",
        entity_id: puzzle.id,
        details: {
          date: puzzle.puzzle_date,
          fact_title: puzzle.fact.title,
        },
      });

      toast({ title: "Puzzle deleted" });
      loadData();
    } catch (err) {
      console.error("Delete error:", err);
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  const openSwapDialog = (puzzle: PuzzleWithFact) => {
    setSwapTarget(puzzle);
    setSwapReason("");
    setSwapDialogOpen(true);
  };

  const handleEmergencySwap = async () => {
    if (!swapTarget || !swapReason.trim()) {
      toast({ title: "Reason is required for emergency swap", variant: "destructive" });
      return;
    }

    try {
      // Delete the current puzzle
      const { error } = await supabase
        .from("measured_daily_puzzles")
        .delete()
        .eq("id", swapTarget.id);

      if (error) throw error;

      await logAuditAction({
        action: "emergency_swap",
        entity_type: "puzzle",
        entity_id: swapTarget.id,
        details: {
          date: swapTarget.puzzle_date,
          fact_title: swapTarget.fact.title,
          was_published: swapTarget.is_published,
        },
        reason: swapReason,
      });

      toast({
        title: "Emergency swap completed",
        description: "The puzzle has been removed. Generate a new one for this date.",
      });
      setSwapDialogOpen(false);
      setSwapTarget(null);
      loadData();
    } catch (err) {
      console.error("Swap error:", err);
      toast({ title: "Swap failed", variant: "destructive" });
    }
  };

  const unpublishedPuzzles = puzzles.filter(p => !p.is_published);
  const publishedPuzzles = puzzles.filter(p => p.is_published);

  const getActionLabel = (action: string) => {
    switch (action) {
      case "publish_puzzle": return "Published puzzle";
      case "generate_puzzle": return "Generated puzzle";
      case "emergency_swap": return "Emergency swap";
      case "approve_candidate": return "Approved candidate";
      case "block_candidate": return "Blocked candidate";
      case "ingest_run": return "Ingestion run";
      case "create_fact": return "Created fact";
      case "edit_fact": return "Edited fact";
      case "retire_fact": return "Retired fact";
      default: return action;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Puzzle Review Queue</h1>
          <p className="text-muted-foreground mt-1">
            Review, approve, and publish daily puzzles
          </p>
        </div>
        <Button variant="outline" onClick={loadData}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Unpublished Puzzles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Awaiting Review ({unpublishedPuzzles.length})
          </CardTitle>
          <CardDescription>Puzzles ready for approval and publishing</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : unpublishedPuzzles.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No puzzles awaiting review</p>
          ) : (
            <div className="space-y-4">
              {unpublishedPuzzles.map(puzzle => (
                <div key={puzzle.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {format(new Date(puzzle.puzzle_date), "EEEE, MMM d, yyyy")}
                        </Badge>
                        <Badge>{puzzle.fact.category}</Badge>
                        <Badge variant="secondary">{puzzle.difficulty}</Badge>
                      </div>
                      
                      <h3 className="font-medium">{puzzle.fact.title}</h3>
                      <p className="text-sm text-muted-foreground">{puzzle.fact.clue_text}</p>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">Target:</span>
                        <span>{puzzle.target_value_int.toLocaleString()} {puzzle.fact.unit_label}</span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {puzzle.tiles.map((tile, i) => (
                          <span key={i} className="px-2 py-1 bg-muted rounded text-sm font-mono">
                            {tile}
                          </span>
                        ))}
                      </div>

                      <div className="text-sm font-mono text-muted-foreground">
                        Solution: {puzzle.solution.A} × {puzzle.solution.B} + {puzzle.solution.C} − {puzzle.solution.D} = {puzzle.target_value_int}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => handlePublish(puzzle)}
                        disabled={publishing === puzzle.id}
                      >
                        {publishing === puzzle.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="mr-2 h-4 w-4" />
                        )}
                        Publish
                      </Button>
                      <Button variant="outline" onClick={() => handleDelete(puzzle)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Published Puzzles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Published ({publishedPuzzles.length})
          </CardTitle>
          <CardDescription>Live and scheduled puzzles</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : publishedPuzzles.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No published puzzles</p>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {publishedPuzzles.map(puzzle => (
                <div key={puzzle.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">
                      {format(new Date(puzzle.puzzle_date), "MMM d")}
                    </span>
                    <Badge className="bg-green-500/20 text-green-500">Live</Badge>
                  </div>
                  <div className="text-sm">{puzzle.fact.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Target: {puzzle.target_value_int.toLocaleString()}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-red-500 hover:text-red-600"
                    onClick={() => openSwapDialog(puzzle)}
                  >
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Emergency Swap
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audit Log */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Audit log of admin actions</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : auditLog.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No activity logged yet</p>
          ) : (
            <div className="space-y-2">
              {auditLog.map(entry => (
                <div key={entry.id} className="flex items-center gap-4 py-2 border-b last:border-0">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{getActionLabel(entry.action)}</span>
                      {entry.reason && (
                        <span className="text-sm text-muted-foreground">— {entry.reason}</span>
                      )}
                    </div>
                    {entry.details && (
                      <div className="text-xs text-muted-foreground ml-6">
                        {JSON.stringify(entry.details)}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(entry.created_at), "MMM d, h:mm a")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Emergency Swap Dialog */}
      <Dialog open={swapDialogOpen} onOpenChange={setSwapDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="h-5 w-5" />
              Emergency Swap
            </DialogTitle>
            <DialogDescription>
              This will remove the published puzzle for {swapTarget?.puzzle_date}. 
              A reason is required for audit purposes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Reason for swap</Label>
              <Textarea
                value={swapReason}
                onChange={(e) => setSwapReason(e.target.value)}
                placeholder="Explain why this puzzle needs to be replaced..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSwapDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleEmergencySwap}>
              Confirm Swap
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
