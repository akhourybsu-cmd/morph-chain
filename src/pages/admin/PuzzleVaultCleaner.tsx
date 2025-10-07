import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";

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

  const cleanupPuzzles = async () => {
    try {
      const failedCount = validationResults.filter(r => !r.valid).length;
      
      if (failedCount === 0) {
        toast({
          title: "No Failed Puzzles",
          description: "All puzzles passed validation!",
        });
        return;
      }

      // Separate valid puzzles by word length
      const valid4L = validationResults
        .filter(r => r.valid && r.puzzle.wordLength === 4)
        .map(r => ({ start: r.puzzle.start, goal: r.puzzle.goal, minDist: r.minDistance || 3 }));
      
      const valid5L = validationResults
        .filter(r => r.valid && r.puzzle.wordLength === 5)
        .map(r => ({ start: r.puzzle.start, goal: r.puzzle.goal, minDist: r.minDistance || 3 }));
      
      const valid6L = validationResults
        .filter(r => r.valid && r.puzzle.wordLength === 6)
        .map(r => ({ start: r.puzzle.start, goal: r.puzzle.goal, minDist: r.minDistance || 3 }));

      // Generate cleaned file contents
      const generate4LContent = () => `// Curated 4-Letter Daily Puzzle Pairs (${valid4L.length} Days)
// These pairs are designed to be approachable, thematic, and multi-path robust
// All puzzles validated for solvability and minimum 3-move requirement

export interface CuratedPuzzlePair {
  start: string;
  goal: string;
  minDist?: number;
}

export const CURATED_4L_PUZZLES: CuratedPuzzlePair[] = [
${valid4L.map(p => `  { start: "${p.start}", goal: "${p.goal}", minDist: ${p.minDist} },`).join('\n')}
];
`;

      const generate5LContent = () => `// Curated 5-Letter Daily Puzzle Pairs (${valid5L.length} Days)
// These pairs are designed to be approachable, thematic, and multi-path robust
// All puzzles validated for solvability and minimum 3-move requirement

export interface CuratedPuzzlePair {
  start: string;
  goal: string;
  minDist?: number;
}

export const CURATED_5L_PUZZLES: CuratedPuzzlePair[] = [
${valid5L.map(p => `  { start: "${p.start}", goal: "${p.goal}", minDist: ${p.minDist} },`).join('\n')}
];
`;

      const generate6LContent = () => `// Curated 6-Letter Daily Puzzle Pairs (${valid6L.length} Days)
// These pairs are designed to be approachable, thematic, and multi-path robust
// All puzzles validated for solvability and minimum 3-move requirement

export interface CuratedPuzzlePair {
  start: string;
  goal: string;
  minDist?: number;
}

export const CURATED_6L_PUZZLES: CuratedPuzzlePair[] = [
${valid6L.map(p => `  { start: "${p.start}", goal: "${p.goal}", minDist: ${p.minDist} },`).join('\n')}
];
`;

      // Download cleaned files
      const downloadFile = (content: string, filename: string) => {
        const blob = new Blob([content], { type: 'text/typescript' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      };

      downloadFile(generate4LContent(), 'curatedPuzzles4L.ts');
      downloadFile(generate5LContent(), 'curatedPuzzles5L.ts');
      downloadFile(generate6LContent(), 'curatedPuzzles6L.ts');

      const totalValid = valid4L.length + valid5L.length + valid6L.length;

      toast({
        title: "Cleanup Complete",
        description: `Removed ${failedCount} failed puzzles. ${totalValid} valid puzzles remain. Files downloaded - please commit them to your repo.`,
      });

      onCleanupComplete();

    } catch (error: any) {
      console.error('Cleanup error:', error);
      toast({
        title: "Cleanup Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const failedCount = validationResults.filter(r => !r.valid).length;

  if (failedCount === 0) return null;

  return (
    <Card className="p-6">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-red-500/10 rounded-lg">
          <Trash2 className="h-6 w-6 text-red-500" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2">Remove Failed Puzzles</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {failedCount} puzzles failed validation. Click below to download cleaned files
            with only valid puzzles that meet all algorithm requirements.
          </p>
          <Button 
            onClick={cleanupPuzzles}
            variant="destructive"
            className="w-full"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Download Cleaned Puzzle Files
          </Button>
        </div>
      </div>
    </Card>
  );
}
