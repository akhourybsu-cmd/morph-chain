import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Trash2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ValidationResult {
  puzzle: { start: string; goal: string; wordLength: number };
  valid: boolean;
  reason?: string;
  minDistance?: number;
  pathCount?: number;
}

interface Props {
  validationResults: ValidationResult[];
  onCleanupComplete: () => void;
}

export function PuzzleVaultCleaner({ validationResults, onCleanupComplete }: Props) {
  const { toast } = useToast();
  const [cleaning, setCleaning] = useState(false);

  const cleanupPuzzles = async () => {
    setCleaning(true);
    try {
      const failedCount = validationResults.filter(r => !r.valid).length;
      
      if (failedCount === 0) {
        toast({
          title: "No Failed Puzzles",
          description: "All puzzles passed validation!",
        });
        setCleaning(false);
        return;
      }

      // Separate valid puzzles by word length with actual validated min distances
      const valid4L = validationResults
        .filter(r => r.valid && r.puzzle.wordLength === 4)
        .map(r => ({ start: r.puzzle.start, goal: r.puzzle.goal, minDist: r.minDistance || 3 }));
      
      const valid5L = validationResults
        .filter(r => r.valid && r.puzzle.wordLength === 5)
        .map(r => ({ start: r.puzzle.start, goal: r.puzzle.goal, minDist: r.minDistance || 3 }));
      
      const valid6L = validationResults
        .filter(r => r.valid && r.puzzle.wordLength === 6)
        .map(r => ({ start: r.puzzle.start, goal: r.puzzle.goal, minDist: r.minDistance || 3 }));

      const totalValid = valid4L.length + valid5L.length + valid6L.length;

      // Store cleaned data in console for AI to access
      console.log('=== CLEANED PUZZLE DATA ===');
      console.log('Valid 4L puzzles:', valid4L.length);
      console.log('Valid 5L puzzles:', valid5L.length);
      console.log('Valid 6L puzzles:', valid6L.length);
      console.log('Total valid:', totalValid);
      console.log('Total removed:', failedCount);
      
      // Store in a format easy for AI to parse
      (window as any).cleanedPuzzles = {
        valid4L,
        valid5L,
        valid6L,
        totalValid,
        failedCount
      };

      toast({
        title: "Ready to Clean Files",
        description: `${failedCount} puzzles will be removed. ${totalValid} valid puzzles will remain. Please ask the AI to "apply the cleaned puzzle files" to update your codebase.`,
        duration: 10000,
      });

      onCleanupComplete();

    } catch (error: any) {
      console.error('Cleanup error:', error);
      toast({
        title: "Cleanup Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setCleaning(false);
    }
  };

  const failedCount = validationResults.filter(r => !r.valid).length;
  const validCount = validationResults.filter(r => r.valid).length;

  if (failedCount === 0) return null;

  return (
    <Card className="p-6 border-red-500/50">
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>{failedCount} puzzles failed validation</strong> and need to be removed.
            {validCount} puzzles passed and will be kept.
          </AlertDescription>
        </Alert>

        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-500/10 rounded-lg">
            <Trash2 className="h-6 w-6 text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">Clean Puzzle Files</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Click below to download cleaned versions of all three curated puzzle files.
              These files will contain only the {validCount} valid puzzles that passed all algorithm checks.
            </p>
            <div className="space-y-2">
              <Button 
                onClick={cleanupPuzzles}
                disabled={cleaning}
                variant="destructive"
                className="w-full"
              >
                {cleaning ? (
                  <>Processing...</>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Prepare Cleaned Files ({validCount} valid puzzles)
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                After clicking, tell me: "apply the cleaned puzzle files"
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

