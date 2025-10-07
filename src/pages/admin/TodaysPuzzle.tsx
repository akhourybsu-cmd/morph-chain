import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, CheckCircle2, XCircle, Loader2, RefreshCw, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getDailyPuzzle } from "@/lib/gameLogic";

interface PuzzleData {
  id: string;
  start_word: string;
  goal_word: string;
  word_length: number;
  min_distance: number;
  puzzle_index: number;
  theme_tags?: string[];
}

interface SolvabilityResult {
  solvable: boolean;
  minMoves: number;
  path: string[];
  computeTime: number;
  dictionarySize: number;
}

export default function TodaysPuzzle() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [puzzles, setPuzzles] = useState<{
    fourLetter: PuzzleData | null;
    fiveLetter: PuzzleData | null;
    sixLetter: PuzzleData | null;
  }>({
    fourLetter: null,
    fiveLetter: null,
    sixLetter: null
  });
  const [solvability, setSolvability] = useState<{
    [key: number]: SolvabilityResult | null;
  }>({
    4: null,
    5: null,
    6: null
  });

  useEffect(() => {
    loadTodaysPuzzles();
  }, []);

  const loadTodaysPuzzles = async () => {
    setLoading(true);
    try {
      // Load the same puzzles that users actually see
      const puzzle4L = getDailyPuzzle(4);
      const puzzle5L = getDailyPuzzle(5);
      const puzzle6L = getDailyPuzzle(6);

      setPuzzles({
        fourLetter: {
          id: 'current-4l',
          start_word: puzzle4L.startWord,
          goal_word: puzzle4L.goalWord,
          word_length: 4,
          min_distance: puzzle4L.minDistance,
          puzzle_index: puzzle4L.puzzleIndex || 0,
        },
        fiveLetter: {
          id: 'current-5l',
          start_word: puzzle5L.startWord,
          goal_word: puzzle5L.goalWord,
          word_length: 5,
          min_distance: puzzle5L.minDistance,
          puzzle_index: puzzle5L.puzzleIndex || 0,
        },
        sixLetter: {
          id: 'current-6l',
          start_word: puzzle6L.startWord,
          goal_word: puzzle6L.goalWord,
          word_length: 6,
          min_distance: puzzle6L.minDistance,
          puzzle_index: puzzle6L.puzzleIndex || 0,
        }
      });

    } catch (error) {
      console.error('Error loading puzzles:', error);
      toast({
        title: "Failed to load puzzles",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const checkSolvability = async (puzzle: PuzzleData) => {
    setChecking(true);
    try {
      // Updated to match new edge function signature
      const { data, error } = await supabase.functions.invoke('check-puzzle-solvability', {
        body: {
          startWord: puzzle.start_word,
          goalWord: puzzle.goal_word,
          wordLength: puzzle.word_length
        }
      });

      if (error) {
        throw error;
      }

      setSolvability(prev => ({
        ...prev,
        [puzzle.word_length]: data as SolvabilityResult
      }));

      if (data.solvable) {
        toast({
          title: "Puzzle is solvable! ✓",
          description: `Minimum path: ${data.minMoves} moves (computed in ${data.computeTime}ms)`
        });
      } else {
        toast({
          title: "Puzzle is NOT solvable!",
          description: "No valid path exists between these words",
          variant: "destructive"
        });
      }

    } catch (error: any) {
      console.error('Solvability check error:', error);
      toast({
        title: "Solvability check failed",
        description: error.message || "Please try again",
        variant: "destructive"
      });
    } finally {
      setChecking(false);
    }
  };

  const renderPuzzleCard = (puzzle: PuzzleData | null, label: string) => {
    if (!puzzle) {
      return (
        <Card className="p-6">
          <div className="text-center space-y-3">
            <h3 className="text-lg font-semibold">{label}</h3>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No puzzle available. Import puzzles to the vault first.
              </AlertDescription>
            </Alert>
          </div>
        </Card>
      );
    }

    const solvabilityResult = solvability[puzzle.word_length];
    const moveBonus = puzzle.word_length === 6 ? 5 : 4;
    const maxMoves = Math.min(14, Math.max(10, puzzle.min_distance + moveBonus));

    return (
      <Card className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold">{label}</h3>
              <p className="text-sm text-muted-foreground">Puzzle #{puzzle.puzzle_index + 1}</p>
            </div>
            <Badge variant="outline" className="text-lg">
              {puzzle.word_length}L
            </Badge>
          </div>

          {/* Puzzle Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Start Word:</p>
              <p className="font-mono font-semibold text-lg">{puzzle.start_word}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Goal Word:</p>
              <p className="font-mono font-semibold text-lg">{puzzle.goal_word}</p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground">Max Moves:</p>
              <p className="font-semibold">{maxMoves} moves</p>
            </div>
          </div>

          {/* Theme Tags */}
          {puzzle.theme_tags && puzzle.theme_tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {puzzle.theme_tags.map((tag, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Solvability Section */}
          <div className="border-t pt-4 space-y-3">
            <Button
              onClick={() => checkSolvability(puzzle)}
              disabled={checking}
              variant="outline"
              size="sm"
              className="w-full"
            >
              {checking ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Check Solvability
                </>
              )}
            </Button>

            {solvabilityResult && (
              <div className="space-y-2">
                {solvabilityResult.solvable ? (
                  <>
                    <Alert className="border-green-500/50 bg-green-500/10">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <AlertDescription className="text-green-700 dark:text-green-400">
                        Puzzle is <strong>SOLVABLE</strong>
                      </AlertDescription>
                    </Alert>
                    <div className="text-sm space-y-1">
                      <p><strong>Shortest Path:</strong> {solvabilityResult.minMoves} moves</p>
                      <p><strong>Compute Time:</strong> {solvabilityResult.computeTime}ms</p>
                      <p><strong>Dictionary Size:</strong> {solvabilityResult.dictionarySize.toLocaleString()} words</p>
                      {solvabilityResult.path.length > 0 && (
                        <div className="mt-2">
                          <p className="font-semibold mb-1">Solution Path:</p>
                          <div className="flex flex-wrap gap-1 font-mono text-xs">
                            {solvabilityResult.path.map((word, idx) => (
                              <span key={idx} className="bg-primary/10 px-2 py-1 rounded">
                                {word}
                                {idx < solvabilityResult.path.length - 1 && " →"}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                      Puzzle is <strong>NOT SOLVABLE</strong> - No valid path exists!
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Today&apos;s Puzzles</h1>
            <p className="text-muted-foreground">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>
        <Button onClick={loadTodaysPuzzles} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Puzzle Cards */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
        {renderPuzzleCard(puzzles.fourLetter, "4-Letter Puzzle")}
        {renderPuzzleCard(puzzles.fiveLetter, "5-Letter Puzzle")}
        {renderPuzzleCard(puzzles.sixLetter, "6-Letter Puzzle")}
      </div>

      {/* Info Alert */}
      <Alert>
        <AlertDescription>
          <strong>Solvability Check:</strong> Uses comprehensive BFS algorithm to verify that a valid path exists 
          between the start and goal words. Rules: 4L uses Δ=1 only, 5L allows Δ≤2 on first move then Δ=1, 
          6L allows Δ≤2 on all moves.
        </AlertDescription>
      </Alert>
    </div>
  );
}
