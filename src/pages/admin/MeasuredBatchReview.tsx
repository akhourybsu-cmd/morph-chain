import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, Play, CheckCircle, XCircle, AlertTriangle, RefreshCw, 
  Calendar, BarChart3, Search, ArrowUpDown, Trash2
} from "lucide-react";
import { logAuditAction } from "@/lib/measured/auditLog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface StagedPuzzle {
  id: string;
  puzzle_date: string;
  fact_id: string;
  target_value_int: number;
  tiles: number[];
  solution: { A: number; B: number; C: number; D: number };
  difficulty: string;
  is_published: boolean;
  created_at: string;
  fact?: {
    title: string;
    clue_text: string;
    category: string;
    unit_label: string;
  };
}

interface BatchStats {
  total: number;
  published: number;
  unpublished: number;
  byCategory: Record<string, number>;
  byDifficulty: Record<string, number>;
  dateRange: { start: string; end: string } | null;
}

const CATEGORIES = ["Geography", "Astronomy", "Science", "Culture", "Anatomy", "Sports", "Engineering", "Biology", "History"];
const DIFFICULTIES = ["easy", "medium", "medium-hard", "showcase"];

export default function MeasuredBatchReview() {
  const [puzzles, setPuzzles] = useState<StagedPuzzle[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("unpublished");
  const [stats, setStats] = useState<BatchStats | null>(null);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [puzzleCount, setPuzzleCount] = useState("200");
  const { toast } = useToast();

  useEffect(() => {
    loadPuzzles();
  }, [categoryFilter, difficultyFilter, statusFilter]);

  const loadPuzzles = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("measured_daily_puzzles")
        .select(`
          *,
          fact:measured_fact_bank(title, clue_text, category, unit_label)
        `)
        .order("puzzle_date", { ascending: true })
        .limit(500);

      if (statusFilter === "published") {
        query = query.eq("is_published", true);
      } else if (statusFilter === "unpublished") {
        query = query.eq("is_published", false);
      }

      const { data, error } = await query;

      if (error) throw error;

      let filteredData = (data || []) as unknown as StagedPuzzle[];
      
      // Apply category filter
      if (categoryFilter !== "all") {
        filteredData = filteredData.filter(p => p.fact?.category === categoryFilter);
      }
      
      // Apply difficulty filter
      if (difficultyFilter !== "all") {
        filteredData = filteredData.filter(p => p.difficulty === difficultyFilter);
      }

      setPuzzles(filteredData);
      calculateStats(filteredData);
    } catch (err) {
      console.error("Error loading puzzles:", err);
      toast({ title: "Error loading puzzles", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: StagedPuzzle[]) => {
    const byCategory: Record<string, number> = {};
    const byDifficulty: Record<string, number> = {};
    let published = 0;
    let unpublished = 0;
    let minDate = "";
    let maxDate = "";

    for (const puzzle of data) {
      if (puzzle.is_published) {
        published++;
      } else {
        unpublished++;
      }

      const category = puzzle.fact?.category || "Unknown";
      byCategory[category] = (byCategory[category] || 0) + 1;

      byDifficulty[puzzle.difficulty] = (byDifficulty[puzzle.difficulty] || 0) + 1;

      if (!minDate || puzzle.puzzle_date < minDate) minDate = puzzle.puzzle_date;
      if (!maxDate || puzzle.puzzle_date > maxDate) maxDate = puzzle.puzzle_date;
    }

    setStats({
      total: data.length,
      published,
      unpublished,
      byCategory,
      byDifficulty,
      dateRange: minDate && maxDate ? { start: minDate, end: maxDate } : null,
    });
  };

  const triggerBatchGeneration = async () => {
    setGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-measured-batch`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ count: parseInt(puzzleCount) }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || "Generation failed");
      }

      toast({
        title: "Batch generation complete",
        description: `Generated ${result.puzzlesGenerated} puzzles from ${result.startDate} to ${result.endDate}.`,
      });

      setShowGenerateDialog(false);
      loadPuzzles();
    } catch (err) {
      console.error("Generation error:", err);
      toast({
        title: "Generation failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredPuzzles.map(p => p.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  const batchPublish = async () => {
    if (selectedIds.size === 0) return;

    try {
      const ids = Array.from(selectedIds);

      const { error } = await supabase
        .from("measured_daily_puzzles")
        .update({ is_published: true })
        .in("id", ids);

      if (error) throw error;

      await logAuditAction({
        action: "batch_publish",
        entity_type: "puzzle_batch",
        details: { count: ids.length },
      });

      toast({ title: `Published ${ids.length} puzzles` });
      setSelectedIds(new Set());
      loadPuzzles();
    } catch (err) {
      console.error("Batch publish error:", err);
      toast({ title: "Publish failed", variant: "destructive" });
    }
  };

  const batchDelete = async () => {
    if (selectedIds.size === 0) return;

    try {
      const ids = Array.from(selectedIds);

      // Only delete unpublished puzzles
      const { error } = await supabase
        .from("measured_daily_puzzles")
        .delete()
        .in("id", ids)
        .eq("is_published", false);

      if (error) throw error;

      await logAuditAction({
        action: "batch_delete",
        entity_type: "puzzle_batch",
        details: { count: ids.length },
      });

      toast({ title: `Deleted ${ids.length} unpublished puzzles` });
      setSelectedIds(new Set());
      loadPuzzles();
    } catch (err) {
      console.error("Batch delete error:", err);
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  const regeneratePuzzle = async (puzzleId: string) => {
    toast({ title: "Regeneration not yet implemented" });
  };

  const filteredPuzzles = puzzles.filter(p => {
    const searchLower = searchQuery.toLowerCase();
    return (
      p.fact?.title?.toLowerCase().includes(searchLower) ||
      p.fact?.clue_text?.toLowerCase().includes(searchLower) ||
      p.puzzle_date.includes(searchQuery)
    );
  });

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return <Badge className="bg-green-500/20 text-green-500">Easy</Badge>;
      case "medium": return <Badge className="bg-yellow-500/20 text-yellow-500">Medium</Badge>;
      case "medium-hard": return <Badge className="bg-orange-500/20 text-orange-500">Med-Hard</Badge>;
      case "showcase": return <Badge className="bg-purple-500/20 text-purple-500">Showcase</Badge>;
      default: return <Badge variant="secondary">{difficulty}</Badge>;
    }
  };

  const formatSolution = (solution: { A: number; B: number; C: number; D: number }) => {
    return `(${solution.A}×${solution.B})+${solution.C}−${solution.D}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Batch Puzzle Review</h1>
          <p className="text-muted-foreground mt-1">
            Generate and review staged daily puzzles
          </p>
        </div>
        <Button onClick={() => setShowGenerateDialog(true)}>
          <Play className="mr-2 h-4 w-4" />
          Generate Batch
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Staged</CardDescription>
              <CardTitle className="text-2xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Published</CardDescription>
              <CardTitle className="text-2xl text-green-500">{stats.published}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Unpublished</CardDescription>
              <CardTitle className="text-2xl text-yellow-500">{stats.unpublished}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Date Range</CardDescription>
              <CardTitle className="text-sm">
                {stats.dateRange 
                  ? `${stats.dateRange.start} to ${stats.dateRange.end}`
                  : "No puzzles"
                }
              </CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Category & Difficulty Distribution */}
      {stats && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Category Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Object.entries(stats.byCategory).map(([cat, count]) => (
                  <Badge key={cat} variant="outline" className="text-xs">
                    {cat}: {count}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4" />
                Difficulty Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Object.entries(stats.byDifficulty).map(([diff, count]) => (
                  <Badge key={diff} variant="outline" className="text-xs">
                    {diff}: {count}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title, clue, or date..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                {DIFFICULTIES.map(diff => (
                  <SelectItem key={diff} value={diff}>{diff}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="unpublished">Unpublished</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={loadPuzzles}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Batch Actions */}
      {selectedIds.size > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">{selectedIds.size} selected</span>
              <Button size="sm" onClick={batchPublish}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Publish Selected
              </Button>
              <Button size="sm" variant="destructive" onClick={batchDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Unpublished
              </Button>
              <Button size="sm" variant="outline" onClick={() => setSelectedIds(new Set())}>
                Clear Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Puzzles Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Staged Puzzles ({filteredPuzzles.length})</CardTitle>
              <CardDescription>Review and publish puzzles</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedIds.size === filteredPuzzles.length && filteredPuzzles.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-muted-foreground">Select All</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredPuzzles.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No puzzles found. Generate a batch to get started.</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead className="w-28">Date</TableHead>
                    <TableHead>Clue</TableHead>
                    <TableHead className="w-24">Category</TableHead>
                    <TableHead className="w-20">Target</TableHead>
                    <TableHead className="w-24">Difficulty</TableHead>
                    <TableHead className="w-32">Solution</TableHead>
                    <TableHead className="w-24">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPuzzles.map((puzzle) => (
                    <TableRow key={puzzle.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(puzzle.id)}
                          onCheckedChange={(checked) => handleSelectOne(puzzle.id, !!checked)}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {puzzle.puzzle_date}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[300px] truncate">
                          <span className="font-medium">{puzzle.fact?.title}</span>
                          <p className="text-xs text-muted-foreground truncate">
                            {puzzle.fact?.clue_text}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{puzzle.fact?.category}</Badge>
                      </TableCell>
                      <TableCell className="font-mono">
                        {puzzle.target_value_int.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {getDifficultyBadge(puzzle.difficulty)}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {formatSolution(puzzle.solution)}
                      </TableCell>
                      <TableCell>
                        {puzzle.is_published ? (
                          <Badge className="bg-green-500/20 text-green-500">Published</Badge>
                        ) : (
                          <Badge className="bg-yellow-500/20 text-yellow-500">Staged</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generate Dialog */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Puzzle Batch</DialogTitle>
            <DialogDescription>
              Generate a batch of daily puzzles from verified facts. Puzzles will be staged (not published) for review.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Number of Puzzles</label>
              <Input
                type="number"
                value={puzzleCount}
                onChange={(e) => setPuzzleCount(e.target.value)}
                min="1"
                max="365"
              />
              <p className="text-xs text-muted-foreground">
                Maximum 365 puzzles per batch. Each puzzle uses one verified fact.
              </p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Requirements:</p>
                  <ul className="list-disc list-inside text-muted-foreground mt-1">
                    <li>Verified facts in the fact bank</li>
                    <li>Category balancing constraints applied</li>
                    <li>Difficulty pacing by day of week</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={triggerBatchGeneration} disabled={generating}>
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Generate {puzzleCount} Puzzles
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
