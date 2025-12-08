import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, AlertTriangle, PlayCircle } from "lucide-react";
import { validatePuzzlePair } from "@/lib/puzzleValidatorV2";
import { runPreflightCheck, generatePreflightReport, runBatchPreflightCheck } from "@/lib/puzzlePreflightCheck";
import { VALID_WORDS_4, VALID_WORDS_5 } from "@/lib/gameLogic";
import { CURATED_4L_PUZZLES } from "@/lib/curatedPuzzles4L";
import { CURATED_5L_PUZZLES } from "@/lib/curatedPuzzles5L";
import { CURATED_6L_PUZZLES } from "@/lib/curatedPuzzles6L";

export default function PuzzleValidator() {
  const { toast } = useToast();
  const [validating, setValidating] = useState(false);
  const [batchValidating, setBatchValidating] = useState(false);
  const [results, setResults] = useState<{
    fourLetter: any[];
    fiveLetter: any[];
    sixLetter: any[];
  } | null>(null);

  const validateAllPuzzles = async () => {
    setBatchValidating(true);
    setResults(null);
    
    try {
      const results4L: any[] = [];
      const results5L: any[] = [];
      const results6L: any[] = [];

      // Validate 4L puzzles
      toast({
        title: "Validating 4L puzzles...",
        description: `Checking ${CURATED_4L_PUZZLES.length} puzzles`
      });
      
      for (let i = 0; i < CURATED_4L_PUZZLES.length; i++) {
        const puzzle = CURATED_4L_PUZZLES[i];
        const result = validatePuzzlePair(
          puzzle.start,
          puzzle.goal,
          4,
          VALID_WORDS_4
        );
        results4L.push({
          index: i,
          ...puzzle,
          ...result
        });
      }

      // Validate 5L puzzles
      toast({
        title: "Validating 5L puzzles...",
        description: `Checking ${CURATED_5L_PUZZLES.length} puzzles`
      });
      
      for (let i = 0; i < CURATED_5L_PUZZLES.length; i++) {
        const puzzle = CURATED_5L_PUZZLES[i];
        const result = validatePuzzlePair(
          puzzle.start,
          puzzle.goal,
          5,
          VALID_WORDS_5
        );
        results5L.push({
          index: i,
          ...puzzle,
          ...result
        });
      }


      // 6L puzzles removed for Core spec - only 4L and 5L supported

      setResults({
        fourLetter: results4L,
        fiveLetter: results5L,
        sixLetter: []
      });

      // Count failures
      const failures4L = results4L.filter(r => !r.solvable || !r.meetsGates).length;
      const failures5L = results5L.filter(r => !r.solvable || !r.meetsGates).length;
      const failures6L = results6L.filter(r => !r.solvable || !r.meetsGates).length;
      const totalFailures = failures4L + failures5L + failures6L;

      if (totalFailures === 0) {
        toast({
          title: "✅ All puzzles validated successfully!",
          description: "All puzzles meet acceptance gates"
        });
      } else {
        toast({
          title: `⚠️ ${totalFailures} puzzles failed validation`,
          description: `4L: ${failures4L}, 5L: ${failures5L}, 6L: ${failures6L}`,
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Validation error:', error);
      toast({
        title: "Validation failed",
        description: "An error occurred during validation",
        variant: "destructive"
      });
    } finally {
      setBatchValidating(false);
    }
  };

  const renderResultsSection = (
    title: string,
    results: any[],
    wordLength: number
  ) => {
    if (!results) return null;

    const passed = results.filter(r => r.solvable && r.meetsGates);
    const failed = results.filter(r => !r.solvable || !r.meetsGates);

    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{title}</h3>
            <Badge variant={failed.length === 0 ? "default" : "destructive"}>
              {passed.length}/{results.length} Passed
            </Badge>
          </div>

          {failed.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-destructive">
                Failed Puzzles ({failed.length}):
              </p>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {failed.map((result) => (
                  <Alert key={result.index} variant="destructive" className="text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-1">
                        <p>
                          <strong>#{result.index + 1}:</strong> {result.start} → {result.goal}
                        </p>
                        {!result.solvable && (
                          <p className="text-xs">❌ Not solvable</p>
                        )}
                        {result.solvable && !result.meetsGates && (
                          <div className="text-xs space-y-0.5">
                            <p>✓ Solvable but fails gates:</p>
                            <p>• Distance: {result.minDistance} (expected: {
                              wordLength === 4 ? '4-7' :
                              wordLength === 5 ? '5-8' :
                              '3-7'
                            })</p>
                            <p>• Paths: {result.pathCount} (minimum: {
                              wordLength === 6 ? 12 : 10
                            })</p>
                            {wordLength === 6 && (
                              <p>• Branching: {result.avgBranching.toFixed(2)} (minimum: 2.7)</p>
                            )}
                            <p className="text-destructive mt-1">
                              {result.failureReason}
                            </p>
                          </div>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </div>
          )}

          {failed.length === 0 && (
            <Alert className="border-green-500/50 bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-700 dark:text-green-400">
                All {title.toLowerCase()} meet acceptance gates ✓
              </AlertDescription>
            </Alert>
          )}

          {/* Stats Summary */}
          <div className="grid grid-cols-3 gap-4 text-sm border-t pt-4">
            <div>
              <p className="text-muted-foreground">Avg Distance</p>
              <p className="font-semibold">
                {(passed.reduce((sum, r) => sum + r.minDistance, 0) / passed.length).toFixed(1)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Avg Paths</p>
              <p className="font-semibold">
                {(passed.reduce((sum, r) => sum + r.pathCount, 0) / passed.length).toFixed(0)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Avg Branching</p>
              <p className="font-semibold">
                {(passed.reduce((sum, r) => sum + r.avgBranching, 0) / passed.length).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Puzzle Validator</h1>
        <p className="text-muted-foreground">
          Comprehensive validation using the battle-tested algorithm with pattern buckets, 
          component analysis, and acceptance gates.
        </p>
      </div>

      {/* Actions */}
      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Validation Actions</h3>
          <div className="flex gap-4">
            <Button
              onClick={validateAllPuzzles}
              disabled={batchValidating}
              size="lg"
            >
              {batchValidating ? (
                <>
                  <PlayCircle className="mr-2 h-5 w-5 animate-pulse" />
                  Validating...
                </>
              ) : (
                <>
                  <PlayCircle className="mr-2 h-5 w-5" />
                  Validate All Curated Puzzles
                </>
              )}
            </Button>
          </div>
          
          <Alert>
            <AlertDescription>
              This will validate all {CURATED_4L_PUZZLES.length} 4L + {CURATED_5L_PUZZLES.length} 5L + {CURATED_6L_PUZZLES.length} 6L 
              curated puzzles against the comprehensive algorithm acceptance gates.
            </AlertDescription>
          </Alert>
        </div>
      </Card>

      {/* Results */}
      {results && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
            <h2 className="text-2xl font-bold">Validation Results</h2>
          </div>

          {renderResultsSection("4-Letter Puzzles", results.fourLetter, 4)}
          {renderResultsSection("5-Letter Puzzles", results.fiveLetter, 5)}
          {renderResultsSection("6-Letter Puzzles", results.sixLetter, 6)}
        </div>
      )}

      {/* Algorithm Info */}
      <Card className="p-6 bg-muted/50">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Algorithm Details</h3>
          <div className="text-sm space-y-1 text-muted-foreground">
            <p>• <strong>Pattern Buckets:</strong> O(1) neighbor lookups via wildcard patterns</p>
            <p>• <strong>Component Analysis:</strong> Instant O(1) solvability checks</p>
            <p>• <strong>Reverse BFS + DP:</strong> Min distance, path counting, and branching analysis</p>
            <p>• <strong>Acceptance Gates:</strong></p>
            <p className="ml-4">- 4L: Distance 4-7, 10+ paths</p>
            <p className="ml-4">- 5L: Distance 5-8, 10+ paths (first move Δ≤2)</p>
            <p className="ml-4">- 6L: Distance 3-7, 12+ paths, 2.7+ branching (all moves Δ≤2)</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
