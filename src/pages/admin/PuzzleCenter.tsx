import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, CheckCircle2, XCircle, Loader2, RefreshCw, AlertTriangle, PlayCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getDailyPuzzle } from "@/lib/gameLogic";
import { toZonedTime, formatInTimeZone } from "date-fns-tz";
import { startOfDay, addDays, differenceInDays } from "date-fns";
import { CURATED_4L_PUZZLES } from "@/lib/curatedPuzzles4L";
import { CURATED_5L_PUZZLES } from "@/lib/curatedPuzzles5L";

interface PuzzleData {
  id: string;
  start_word: string;
  goal_word: string;
  word_length: number;
  min_distance: number;
  puzzle_index: number;
}

interface SolvabilityResult {
  solvable: boolean;
  minMoves: number;
  path: string[];
  computeTime: number;
  dictionarySize: number;
}

interface ScheduledPuzzle {
  date: string;
  dayLabel: string;
  wordLength: 4 | 5;
  startWord: string;
  goalWord: string;
  minDistance: number;
  puzzleIndex: number;
  solvable?: boolean;
  checking?: boolean;
}

export default function PuzzleCenter() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [puzzles, setPuzzles] = useState<{
    fourLetter: PuzzleData | null;
    fiveLetter: PuzzleData | null;
  }>({
    fourLetter: null,
    fiveLetter: null
  });
  const [solvability, setSolvability] = useState<{
    [key: number]: SolvabilityResult | null;
  }>({
    4: null,
    5: null
  });
  const [scheduledPuzzles, setScheduledPuzzles] = useState<ScheduledPuzzle[]>([]);
  const [daysAhead, setDaysAhead] = useState(14);
  const [testingAll, setTestingAll] = useState(false);

  useEffect(() => {
    loadTodaysPuzzles();
    loadScheduledPuzzles();
  }, [daysAhead]);

  const loadTodaysPuzzles = async () => {
    setLoading(true);
    try {
      const puzzle4L = getDailyPuzzle(4);
      const puzzle5L = getDailyPuzzle(5);

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

  const loadScheduledPuzzles = () => {
    try {
      const timezone = "America/New_York";
      const nowNY = toZonedTime(new Date(), timezone);
      const todayNY = startOfDay(nowNY);
      
      const puzzles: ScheduledPuzzle[] = [];
      const launchDateNY = startOfDay(toZonedTime(new Date('2025-10-06T00:00:00'), timezone));
      
      for (let i = 0; i < daysAhead; i++) {
        const targetDate = addDays(todayNY, i);
        const dateStr = formatInTimeZone(targetDate, timezone, "yyyy-MM-dd");
        const dayLabel = i === 0 ? "Today" : i === 1 ? "Tomorrow" : `Day +${i}`;
        const daysSinceLaunch = differenceInDays(targetDate, launchDateNY);
        
        [4, 5].forEach((wordLength) => {
          const curatedPuzzles = wordLength === 4 ? CURATED_4L_PUZZLES : CURATED_5L_PUZZLES;
          const puzzleIndex = daysSinceLaunch % curatedPuzzles.length;
          const candidatePuzzle = curatedPuzzles[puzzleIndex];
          
          puzzles.push({
            date: dateStr,
            dayLabel,
            wordLength: wordLength as 4 | 5,
            startWord: candidatePuzzle.start,
            goalWord: candidatePuzzle.goal,
            minDistance: candidatePuzzle.minDist || 0,
            puzzleIndex,
            solvable: undefined,
            checking: false
          });
        });
      }
      
      setScheduledPuzzles(puzzles);
    } catch (error) {
      console.error('Error loading scheduled puzzles:', error);
    }
  };

  const checkSolvability = async (puzzle: PuzzleData) => {
    setChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-puzzle-solvability', {
        body: {
          startWord: puzzle.start_word,
          goalWord: puzzle.goal_word,
          wordLength: puzzle.word_length
        }
      });

      if (error) throw error;

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

  const checkScheduledSolvability = async (puzzle: ScheduledPuzzle) => {
    setScheduledPuzzles(prev => 
      prev.map(p => 
        p.date === puzzle.date && p.wordLength === puzzle.wordLength 
          ? { ...p, checking: true } 
          : p
      )
    );

    try {
      const { data, error } = await supabase.functions.invoke('check-puzzle-solvability', {
        body: {
          startWord: puzzle.startWord,
          goalWord: puzzle.goalWord,
          wordLength: puzzle.wordLength
        }
      });

      if (error) throw error;

      setScheduledPuzzles(prev => 
        prev.map(p => 
          p.date === puzzle.date && p.wordLength === puzzle.wordLength 
            ? { ...p, solvable: data.solvable, checking: false } 
            : p
        )
      );

      if (!data.solvable) {
        toast({
          title: "Warning: Unsolvable Puzzle!",
          description: `${puzzle.startWord} → ${puzzle.goalWord} (${puzzle.wordLength}L) on ${puzzle.date}`,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      setScheduledPuzzles(prev => 
        prev.map(p => 
          p.date === puzzle.date && p.wordLength === puzzle.wordLength 
            ? { ...p, checking: false } 
            : p
        )
      );
    }
  };

  const testAllUpcoming = async () => {
    setTestingAll(true);
    toast({
      title: "Testing All Puzzles",
      description: `Checking ${scheduledPuzzles.length} puzzles...`,
    });

    let failed = 0;
    
    for (const puzzle of scheduledPuzzles) {
      await checkScheduledSolvability(puzzle);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setTestingAll(false);
    
    const failedPuzzles = scheduledPuzzles.filter(p => p.solvable === false);
    if (failedPuzzles.length > 0) {
      toast({
        title: "Testing Complete",
        description: `Found ${failedPuzzles.length} unsolvable puzzles!`,
        variant: "destructive"
      });
    } else {
      toast({
        title: "All Puzzles Valid!",
        description: "All scheduled puzzles are solvable.",
      });
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
              <AlertDescription>No puzzle available.</AlertDescription>
            </Alert>
          </div>
        </Card>
      );
    }

    const solvabilityResult = solvability[puzzle.word_length];
    const maxMoves = Math.min(14, Math.max(10, puzzle.min_distance + 4));

    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold">{label}</h3>
              <p className="text-sm text-muted-foreground">Puzzle #{puzzle.puzzle_index + 1}</p>
            </div>
            <Badge variant="outline" className="text-lg">{puzzle.word_length}L</Badge>
          </div>

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
                      <p><strong>Dictionary Size:</strong> {solvabilityResult.dictionarySize.toLocaleString()} words</p>
                      {solvabilityResult.path.length > 0 && (
                        <div className="mt-2">
                          <p className="font-semibold mb-1">Solution Path:</p>
                          <div className="flex flex-wrap gap-1 font-mono text-xs">
                            {solvabilityResult.path.map((word, idx) => (
                              <span key={idx} className="bg-primary/10 px-2 py-1 rounded">
                                {word}{idx < solvabilityResult.path.length - 1 && " →"}
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

  const groupedByDate = scheduledPuzzles.reduce((acc, puzzle) => {
    if (!acc[puzzle.date]) {
      acc[puzzle.date] = { dayLabel: puzzle.dayLabel, puzzles: [] };
    }
    acc[puzzle.date].puzzles.push(puzzle);
    return acc;
  }, {} as Record<string, { dayLabel: string; puzzles: ScheduledPuzzle[] }>);

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Puzzle Center</h1>
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

      <Tabs defaultValue="today" className="space-y-4">
        <TabsList>
          <TabsTrigger value="today">Today's Puzzles</TabsTrigger>
          <TabsTrigger value="schedule">Upcoming Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {renderPuzzleCard(puzzles.fourLetter, "4-Letter Puzzle")}
            {renderPuzzleCard(puzzles.fiveLetter, "5-Letter Puzzle")}
          </div>

          <Alert>
            <AlertDescription>
              <strong>Solvability Check:</strong> Uses comprehensive BFS algorithm to verify that a valid path exists 
              between the start and goal words using the curated dictionary.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <select
                value={daysAhead}
                onChange={(e) => setDaysAhead(Number(e.target.value))}
                className="px-3 py-2 rounded-md border bg-background"
              >
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={30}>30 days</option>
                <option value={60}>60 days</option>
              </select>
              <Button 
                onClick={testAllUpcoming}
                disabled={testingAll}
                variant="default"
              >
                {testingAll ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Test All
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {Object.entries(groupedByDate).map(([date, group]) => (
              <Card key={date} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold">{group.dayLabel}</h3>
                    <p className="text-sm text-muted-foreground">{date}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {group.puzzles.every(p => p.solvable === true) && (
                      <Badge variant="default" className="bg-green-500">All Valid</Badge>
                    )}
                    {group.puzzles.some(p => p.solvable === false) && (
                      <Badge variant="destructive">Issues Found</Badge>
                    )}
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {group.puzzles.map(puzzle => (
                    <div 
                      key={`${puzzle.date}-${puzzle.wordLength}`}
                      className={`p-3 rounded-lg border ${
                        puzzle.solvable === false 
                          ? 'bg-red-500/5 border-red-500/20' 
                          : puzzle.solvable === true 
                          ? 'bg-green-500/5 border-green-500/20'
                          : 'bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <Badge variant="outline" className="mb-1">{puzzle.wordLength}L</Badge>
                          <div className="font-mono font-semibold">
                            {puzzle.startWord} → {puzzle.goalWord}
                          </div>
                        </div>
                        <div>
                          {puzzle.checking ? (
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                          ) : puzzle.solvable === true ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : puzzle.solvable === false ? (
                            <XCircle className="h-5 w-5 text-red-500" />
                          ) : (
                            <Button
                              onClick={() => checkScheduledSolvability(puzzle)}
                              size="sm"
                              variant="outline"
                            >
                              Test
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}