import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, CheckCircle2, XCircle, Loader2, AlertTriangle, PlayCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getDailyPuzzle } from "@/lib/gameLogic";
import { toZonedTime, formatInTimeZone } from "date-fns-tz";
import { startOfDay, addDays } from "date-fns";

interface ScheduledPuzzle {
  date: string;
  dayLabel: string;
  wordLength: 4 | 5 | 6;
  startWord: string;
  goalWord: string;
  minDistance: number;
  puzzleIndex: number;
  solvable?: boolean;
  checking?: boolean;
}

export default function ScheduledPuzzles() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [scheduledPuzzles, setScheduledPuzzles] = useState<ScheduledPuzzle[]>([]);
  const [daysAhead, setDaysAhead] = useState(14);
  const [testingAll, setTestingAll] = useState(false);

  useEffect(() => {
    loadScheduledPuzzles();
  }, [daysAhead]);

  const loadScheduledPuzzles = () => {
    setLoading(true);
    try {
      const timezone = "America/New_York";
      const nowNY = toZonedTime(new Date(), timezone);
      const todayNY = startOfDay(nowNY);
      
      const puzzles: ScheduledPuzzle[] = [];
      
      // Generate schedule for next N days
      for (let i = 0; i < daysAhead; i++) {
        const targetDate = addDays(todayNY, i);
        const dateStr = formatInTimeZone(targetDate, timezone, "yyyy-MM-dd");
        const dayLabel = i === 0 ? "Today" : i === 1 ? "Tomorrow" : `Day +${i}`;
        
        // Get puzzles for each word length on this date
        [4, 5, 6].forEach((wordLength) => {
          // Temporarily set date for getDailyPuzzle calculation
          const originalDate = new Date();
          Object.defineProperty(global, 'Date', {
            value: class extends Date {
              constructor() {
                super();
                return targetDate;
              }
            }
          });
          
          const puzzle = getDailyPuzzle(wordLength as 4 | 5 | 6);
          
          // Restore original Date
          Object.defineProperty(global, 'Date', { value: originalDate });
          
          puzzles.push({
            date: dateStr,
            dayLabel,
            wordLength: wordLength as 4 | 5 | 6,
            startWord: puzzle.startWord,
            goalWord: puzzle.goalWord,
            minDistance: puzzle.minDistance,
            puzzleIndex: puzzle.puzzleIndex || 0,
            solvable: undefined,
            checking: false
          });
        });
      }
      
      setScheduledPuzzles(puzzles);
    } catch (error) {
      console.error('Error loading scheduled puzzles:', error);
      toast({
        title: "Failed to load schedule",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const checkSolvability = async (puzzle: ScheduledPuzzle) => {
    // Update checking state
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

      // Update with result
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
      console.error('Solvability check error:', error);
      setScheduledPuzzles(prev => 
        prev.map(p => 
          p.date === puzzle.date && p.wordLength === puzzle.wordLength 
            ? { ...p, checking: false } 
            : p
        )
      );
      toast({
        title: "Check Failed",
        description: error.message || "Please try again",
        variant: "destructive"
      });
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
      await checkSolvability(puzzle);
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check if this puzzle failed
      const updated = scheduledPuzzles.find(
        p => p.date === puzzle.date && p.wordLength === puzzle.wordLength
      );
      if (updated && updated.solvable === false) {
        failed++;
      }
    }

    setTestingAll(false);
    
    if (failed > 0) {
      toast({
        title: "Testing Complete",
        description: `Found ${failed} unsolvable puzzles!`,
        variant: "destructive"
      });
    } else {
      toast({
        title: "All Puzzles Valid!",
        description: "All scheduled puzzles are solvable.",
      });
    }
  };

  const renderPuzzleCard = (puzzle: ScheduledPuzzle) => {
    return (
      <div 
        key={`${puzzle.date}-${puzzle.wordLength}`}
        className={`p-4 rounded-lg border ${
          puzzle.solvable === false 
            ? 'bg-red-500/5 border-red-500/20' 
            : puzzle.solvable === true 
            ? 'bg-green-500/5 border-green-500/20'
            : 'bg-muted/50'
        }`}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline">{puzzle.wordLength}L</Badge>
              <span className="text-sm text-muted-foreground">Puzzle #{puzzle.puzzleIndex + 1}</span>
            </div>
            <div className="font-mono font-semibold text-lg">
              {puzzle.startWord} → {puzzle.goalWord}
            </div>
            <div className="text-sm text-muted-foreground">
              Min Distance: {puzzle.minDistance}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {puzzle.checking ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : puzzle.solvable === true ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : puzzle.solvable === false ? (
              <XCircle className="h-5 w-5 text-red-500" />
            ) : (
              <Button
                onClick={() => checkSolvability(puzzle)}
                size="sm"
                variant="outline"
              >
                <PlayCircle className="h-4 w-4 mr-1" />
                Test
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const groupedByDate = scheduledPuzzles.reduce((acc, puzzle) => {
    if (!acc[puzzle.date]) {
      acc[puzzle.date] = {
        dayLabel: puzzle.dayLabel,
        puzzles: []
      };
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Scheduled Puzzles</h1>
            <p className="text-muted-foreground">
              View and test puzzles for the next {daysAhead} days
            </p>
          </div>
        </div>
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

      {/* Info Alert */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Puzzle Scheduling:</strong> Puzzles are automatically cycled from the curated lists based on the date.
          Use "Test All" to verify all upcoming puzzles are solvable before they go live.
        </AlertDescription>
      </Alert>

      {/* Scheduled Puzzles by Date */}
      <div className="space-y-6">
        {Object.entries(groupedByDate).map(([date, group]) => (
          <Card key={date} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold">{group.dayLabel}</h3>
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
            <div className="grid gap-3 md:grid-cols-3">
              {group.puzzles.map(puzzle => renderPuzzleCard(puzzle))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
