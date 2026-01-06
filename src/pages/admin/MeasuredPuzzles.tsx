import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CalendarIcon, Sparkles, CheckCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { format, addDays } from "date-fns";
import { generatePuzzle, verifyPuzzle, type PuzzleSolution } from "@/lib/measured/puzzleGenerator";
import { getCategoryPressure, type CategoryPressure } from "@/lib/measured/categoryBalancing";
import { logAuditAction } from "@/lib/measured/auditLog";

interface Fact {
  id: string;
  title: string;
  clue_text: string;
  reveal_blurb: string;
  canonical_value_int: number;
  unit_label: string;
  category: string;
  times_used: number;
  last_used_date: string | null;
}

interface DailyPuzzle {
  id: string;
  puzzle_date: string;
  fact_id: string;
  target_value_int: number;
  tiles: number[];
  solution: PuzzleSolution;
  difficulty: string;
  is_published: boolean;
}

interface GeneratedPreview {
  tiles: number[];
  solution: PuzzleSolution;
  nearMissCount: number;
  isUnique: boolean;
}

export default function MeasuredPuzzles() {
  const [facts, setFacts] = useState<Fact[]>([]);
  const [puzzles, setPuzzles] = useState<DailyPuzzle[]>([]);
  const [categoryPressure, setCategoryPressure] = useState<CategoryPressure[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(addDays(new Date(), 1));
  const [selectedFact, setSelectedFact] = useState<Fact | null>(null);
  const [generatedPreview, setGeneratedPreview] = useState<GeneratedPreview | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load verified facts
      const { data: factsData, error: factsError } = await supabase
        .from("measured_fact_bank")
        .select("*")
        .eq("status", "verified")
        .order("times_used", { ascending: true })
        .order("last_used_date", { ascending: true, nullsFirst: true });

      if (factsError) throw factsError;
      setFacts(factsData || []);

      // Load existing puzzles
      const { data: puzzlesData, error: puzzlesError } = await supabase
        .from("measured_daily_puzzles")
        .select("*")
        .gte("puzzle_date", format(new Date(), "yyyy-MM-dd"))
        .order("puzzle_date", { ascending: true });

      if (puzzlesError) throw puzzlesError;
      setPuzzles((puzzlesData || []).map(p => ({
        ...p,
        tiles: p.tiles as number[],
        solution: p.solution as PuzzleSolution,
      })));

      // Calculate category pressure
      const pressure = await getCategoryPressure();
      setCategoryPressure(pressure);
    } catch (err) {
      console.error("Error loading data:", err);
      toast({ title: "Error loading data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFact = (factId: string) => {
    const fact = facts.find(f => f.id === factId);
    setSelectedFact(fact || null);
    setGeneratedPreview(null);
  };

  const handleGeneratePreview = () => {
    if (!selectedFact) return;

    setGenerating(true);
    try {
      const puzzle = generatePuzzle(selectedFact.canonical_value_int);

      if (!puzzle) {
        toast({
          title: "Generation failed",
          description: "Could not generate a unique puzzle for this target value. Try a different fact.",
          variant: "destructive",
        });
        return;
      }

      setGeneratedPreview({
        tiles: puzzle.tiles,
        solution: puzzle.solution,
        nearMissCount: puzzle.nearMissCount,
        isUnique: puzzle.isUnique,
      });

      toast({ title: "Puzzle generated successfully" });
    } catch (err) {
      console.error("Generation error:", err);
      toast({ title: "Generation failed", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleSavePuzzle = async () => {
    if (!selectedFact || !generatedPreview) return;

    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");

      // Check if puzzle already exists for this date
      const { data: existing } = await supabase
        .from("measured_daily_puzzles")
        .select("id")
        .eq("puzzle_date", dateStr)
        .single();

      if (existing) {
        toast({
          title: "Puzzle already exists",
          description: "A puzzle already exists for this date. Delete it first or choose a different date.",
          variant: "destructive",
        });
        return;
      }

      // Get template (use default 4-slot template)
      const { data: template } = await supabase
        .from("measured_puzzle_templates")
        .select("id")
        .eq("template_key", "4slot_multiply_add_subtract")
        .single();

      const templateId = template?.id || "00000000-0000-0000-0000-000000000001";

      const { error } = await supabase.from("measured_daily_puzzles").insert({
        puzzle_date: dateStr,
        fact_id: selectedFact.id,
        template_id: templateId,
        target_value_int: selectedFact.canonical_value_int,
        tiles: generatedPreview.tiles,
        solution: generatedPreview.solution,
        difficulty: getDifficulty(selectedFact.canonical_value_int),
        is_published: false,
      });

      if (error) throw error;

      await logAuditAction("generate_puzzle", "puzzle", undefined, {
        date: dateStr,
        fact_title: selectedFact.title,
        target: selectedFact.canonical_value_int,
      });

      toast({ title: "Puzzle saved successfully" });
      setGeneratedPreview(null);
      setSelectedFact(null);
      loadData();
    } catch (err) {
      console.error("Save error:", err);
      toast({ title: "Failed to save puzzle", variant: "destructive" });
    }
  };

  const getDifficulty = (target: number): string => {
    if (target > 5000) return "hard";
    if (target > 500) return "medium";
    return "easy";
  };

  const getPressureBadge = (category: string) => {
    const pressure = categoryPressure.find(p => p.category === category);
    if (!pressure) return null;

    switch (pressure.pressure) {
      case "blocked": return <Badge className="bg-red-500/20 text-red-500">Blocked</Badge>;
      case "high": return <Badge className="bg-orange-500/20 text-orange-500">High Pressure</Badge>;
      case "medium": return <Badge className="bg-yellow-500/20 text-yellow-500">Medium</Badge>;
      default: return <Badge className="bg-green-500/20 text-green-500">Available</Badge>;
    }
  };

  const existingPuzzleForDate = puzzles.find(p => p.puzzle_date === format(selectedDate, "yyyy-MM-dd"));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Measured Puzzle Generator</h1>
          <p className="text-muted-foreground mt-1">
            Generate and schedule daily puzzles with category balancing
          </p>
        </div>
        <Button variant="outline" onClick={loadData}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Date Selection & Category Pressure */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Select Date</CardTitle>
            </CardHeader>
            <CardContent>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedDate, "EEEE, MMM d, yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
              {existingPuzzleForDate && (
                <div className="mt-4 p-3 border rounded-lg bg-yellow-500/10 border-yellow-500/30">
                  <div className="flex items-center gap-2 text-yellow-500">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">Puzzle exists for this date</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Category Pressure</CardTitle>
              <CardDescription>Usage over last 7 and 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <div className="space-y-2">
                  {categoryPressure.map(cp => (
                    <div key={cp.category} className="flex items-center justify-between py-2 border-b last:border-0">
                      <span className="text-sm">{cp.category}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {cp.usage7d}/7d, {cp.usage30d}/30d
                        </span>
                        {getPressureBadge(cp.category)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Middle: Fact Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Fact</CardTitle>
            <CardDescription>Choose from verified facts (sorted by least used)</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Select onValueChange={handleSelectFact}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a fact..." />
                </SelectTrigger>
                <SelectContent className="max-h-[400px]">
                  {facts.map(fact => (
                    <SelectItem key={fact.id} value={fact.id}>
                      <div className="flex items-center gap-2">
                        <span>{fact.title}</span>
                        <Badge variant="outline" className="text-xs">{fact.category}</Badge>
                        <span className="text-xs text-muted-foreground">
                          ({fact.times_used}x used)
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {selectedFact && (
              <div className="mt-4 space-y-4">
                <div className="p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge>{selectedFact.category}</Badge>
                    {getPressureBadge(selectedFact.category)}
                  </div>
                  <h3 className="font-medium">{selectedFact.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{selectedFact.clue_text}</p>
                  <div className="mt-2 text-sm">
                    <span className="font-medium">Target: </span>
                    {selectedFact.canonical_value_int.toLocaleString()} {selectedFact.unit_label}
                  </div>
                </div>

                <Button
                  onClick={handleGeneratePreview}
                  disabled={generating}
                  className="w-full"
                >
                  {generating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  Generate Puzzle
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Generated Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Generated Puzzle</CardTitle>
            <CardDescription>Preview and save</CardDescription>
          </CardHeader>
          <CardContent>
            {generatedPreview ? (
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    {generatedPreview.isUnique ? (
                      <Badge className="bg-green-500/20 text-green-500 gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Unique Solution
                      </Badge>
                    ) : (
                      <Badge className="bg-red-500/20 text-red-500 gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Multiple Solutions
                      </Badge>
                    )}
                    <Badge variant="outline">
                      {generatedPreview.nearMissCount} near-misses
                    </Badge>
                  </div>

                  <div className="mb-4">
                    <span className="text-sm text-muted-foreground">Tiles:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {generatedPreview.tiles.map((tile, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-primary/20 rounded-md font-mono text-sm"
                        >
                          {tile}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-sm text-muted-foreground">Solution:</span>
                    <div className="font-mono text-lg mt-1">
                      {generatedPreview.solution.A} × {generatedPreview.solution.B} + {generatedPreview.solution.C} − {generatedPreview.solution.D} = {selectedFact?.canonical_value_int}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleGeneratePreview}
                    className="flex-1"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Regenerate
                  </Button>
                  <Button
                    onClick={handleSavePuzzle}
                    disabled={!!existingPuzzleForDate}
                    className="flex-1"
                  >
                    Save Puzzle
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Select a fact and generate a puzzle</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Scheduled Puzzles */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Puzzles</CardTitle>
          <CardDescription>Upcoming puzzles awaiting review</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : puzzles.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No puzzles scheduled yet</p>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {puzzles.map(puzzle => (
                <div key={puzzle.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">
                      {format(new Date(puzzle.puzzle_date), "MMM d")}
                    </span>
                    {puzzle.is_published ? (
                      <Badge className="bg-green-500/20 text-green-500">Published</Badge>
                    ) : (
                      <Badge variant="secondary">Draft</Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Target: {puzzle.target_value_int.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {puzzle.difficulty}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
