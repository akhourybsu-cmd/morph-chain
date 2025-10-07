import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Upload, Database, Lock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { CURATED_4L_PUZZLES } from "@/lib/curatedPuzzles4L";
import { CURATED_5L_PUZZLES } from "@/lib/curatedPuzzles5L";
import { CURATED_6L_PUZZLES } from "@/lib/curatedPuzzles6L";
import { validatePuzzlePair } from "@/lib/puzzleValidatorV2";
import { VALID_WORDS_4, VALID_WORDS_5, VALID_WORDS_6 } from "@/lib/gameLogic";
import { Badge } from "@/components/ui/badge";

interface ValidationResult {
  puzzle: { start: string; goal: string; wordLength: number };
  valid: boolean;
  reason?: string;
  minDistance?: number;
  pathCount?: number;
}

export default function PuzzleVault() {
  const { toast } = useToast();
  const [importing, setImporting] = useState(false);
  const [validating, setValidating] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    length4: number;
    length5: number;
    length6: number;
  } | null>(null);

  const loadStats = async () => {
    try {
      const { count: total } = await supabase
        .from('admin_puzzle_vault')
        .select('*', { count: 'exact', head: true });

      const { count: length4 } = await supabase
        .from('admin_puzzle_vault')
        .select('*', { count: 'exact', head: true })
        .eq('word_length', 4);

      const { count: length5 } = await supabase
        .from('admin_puzzle_vault')
        .select('*', { count: 'exact', head: true })
        .eq('word_length', 5);

      const { count: length6 } = await supabase
        .from('admin_puzzle_vault')
        .select('*', { count: 'exact', head: true })
        .eq('word_length', 6);

      setStats({
        total: total || 0,
        length4: length4 || 0,
        length5: length5 || 0,
        length6: length6 || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const validateAllPuzzles = async () => {
    setValidating(true);
    setValidationResults([]);
    
    try {
      const results: ValidationResult[] = [];
      
      toast({
        title: "Validating Puzzles",
        description: "Testing all curated puzzles with new algorithm...",
      });
      
      // Validate 4L puzzles
      for (const puzzle of CURATED_4L_PUZZLES) {
        const validation = validatePuzzlePair(puzzle.start, puzzle.goal, 4, VALID_WORDS_4);
        results.push({
          puzzle: { start: puzzle.start, goal: puzzle.goal, wordLength: 4 },
          valid: validation.solvable && validation.meetsGates && validation.minDistance >= 3,
          reason: !validation.solvable ? validation.failureReason : 
                  validation.minDistance < 3 ? `Distance too short (${validation.minDistance})` :
                  !validation.meetsGates ? validation.failureReason : undefined,
          minDistance: validation.minDistance,
          pathCount: validation.pathCount
        });
      }
      
      // Validate 5L puzzles
      for (const puzzle of CURATED_5L_PUZZLES) {
        const validation = validatePuzzlePair(puzzle.start, puzzle.goal, 5, VALID_WORDS_5);
        results.push({
          puzzle: { start: puzzle.start, goal: puzzle.goal, wordLength: 5 },
          valid: validation.solvable && validation.meetsGates && validation.minDistance >= 3,
          reason: !validation.solvable ? validation.failureReason : 
                  validation.minDistance < 3 ? `Distance too short (${validation.minDistance})` :
                  !validation.meetsGates ? validation.failureReason : undefined,
          minDistance: validation.minDistance,
          pathCount: validation.pathCount
        });
      }
      
      // Validate 6L puzzles
      for (const puzzle of CURATED_6L_PUZZLES) {
        const validation = validatePuzzlePair(puzzle.start, puzzle.goal, 6, VALID_WORDS_6);
        results.push({
          puzzle: { start: puzzle.start, goal: puzzle.goal, wordLength: 6 },
          valid: validation.solvable && validation.meetsGates && validation.minDistance >= 3,
          reason: !validation.solvable ? validation.failureReason : 
                  validation.minDistance < 3 ? `Distance too short (${validation.minDistance})` :
                  !validation.meetsGates ? validation.failureReason : undefined,
          minDistance: validation.minDistance,
          pathCount: validation.pathCount
        });
      }
      
      setValidationResults(results);
      
      const validCount = results.filter(r => r.valid).length;
      const invalidCount = results.length - validCount;
      
      toast({
        title: "Validation Complete",
        description: `${validCount} valid, ${invalidCount} failed`,
        variant: invalidCount > 0 ? "destructive" : "default"
      });
      
    } catch (error: any) {
      console.error('Validation error:', error);
      toast({
        title: "Validation Failed",
        description: error.message || "Failed to validate puzzles",
        variant: "destructive"
      });
    } finally {
      setValidating(false);
    }
  };

  const removeFailedPuzzles = async () => {
    if (validationResults.length === 0) {
      toast({
        title: "No Validation Data",
        description: "Please run validation first",
        variant: "destructive"
      });
      return;
    }

    setRemoving(true);
    
    try {
      const failedPuzzles = validationResults.filter(r => !r.valid);
      
      if (failedPuzzles.length === 0) {
        toast({
          title: "No Failed Puzzles",
          description: "All puzzles passed validation!",
        });
        setRemoving(false);
        return;
      }

      // Group failed puzzles by word length
      const failed4L = new Set(
        failedPuzzles
          .filter(r => r.puzzle.wordLength === 4)
          .map(r => `${r.puzzle.start}-${r.puzzle.goal}`)
      );
      const failed5L = new Set(
        failedPuzzles
          .filter(r => r.puzzle.wordLength === 5)
          .map(r => `${r.puzzle.start}-${r.puzzle.goal}`)
      );
      const failed6L = new Set(
        failedPuzzles
          .filter(r => r.puzzle.wordLength === 6)
          .map(r => `${r.puzzle.start}-${r.puzzle.goal}`)
      );

      // Filter out failed puzzles
      const cleaned4L = CURATED_4L_PUZZLES.filter(
        p => !failed4L.has(`${p.start}-${p.goal}`)
      );
      const cleaned5L = CURATED_5L_PUZZLES.filter(
        p => !failed5L.has(`${p.start}-${p.goal}`)
      );
      const cleaned6L = CURATED_6L_PUZZLES.filter(
        p => !failed6L.has(`${p.start}-${p.goal}`)
      );

      // Generate updated file contents
      const generate4LContent = () => {
        let content = `// Curated 4-Letter Daily Puzzle Pairs (${cleaned4L.length} Days)\n`;
        content += `// These pairs are designed to be approachable, thematic, and multi-path robust\n\n`;
        content += `export interface CuratedPuzzlePair {\n`;
        content += `  start: string;\n`;
        content += `  goal: string;\n`;
        content += `  minDist?: number;\n`;
        content += `}\n\n`;
        content += `export const CURATED_4L_PUZZLES: CuratedPuzzlePair[] = [\n`;
        cleaned4L.forEach(p => {
          content += `  { start: "${p.start}", goal: "${p.goal}", minDist: ${p.minDist || 3} },\n`;
        });
        content += `];\n`;
        return content;
      };

      const generate5LContent = () => {
        let content = `// Curated 5-Letter Daily Puzzle Pairs (${cleaned5L.length} Days)\n`;
        content += `// These pairs are designed to be approachable, thematic, and multi-path robust\n\n`;
        content += `export interface CuratedPuzzlePair {\n`;
        content += `  start: string;\n`;
        content += `  goal: string;\n`;
        content += `  minDist?: number;\n`;
        content += `}\n\n`;
        content += `export const CURATED_5L_PUZZLES: CuratedPuzzlePair[] = [\n`;
        cleaned5L.forEach(p => {
          content += `  { start: "${p.start}", goal: "${p.goal}", minDist: ${p.minDist || 3} },\n`;
        });
        content += `];\n`;
        return content;
      };

      const generate6LContent = () => {
        let content = `// Curated 6-Letter Daily Puzzle Pairs (${cleaned6L.length} Days)\n`;
        content += `// These pairs are designed to be approachable, thematic, and multi-path robust\n\n`;
        content += `export interface CuratedPuzzlePair {\n`;
        content += `  start: string;\n`;
        content += `  goal: string;\n`;
        content += `  minDist?: number;\n`;
        content += `}\n\n`;
        content += `export const CURATED_6L_PUZZLES: CuratedPuzzlePair[] = [\n`;
        cleaned6L.forEach(p => {
          content += `  { start: "${p.start}", goal: "${p.goal}", minDist: ${p.minDist || 3} },\n`;
        });
        content += `];\n`;
        return content;
      };

      // Show confirmation dialog with download links
      const totalRemoved = failedPuzzles.length;
      const totalRemaining = cleaned4L.length + cleaned5L.length + cleaned6L.length;

      // Create download blobs
      const blob4L = new Blob([generate4LContent()], { type: 'text/typescript' });
      const blob5L = new Blob([generate5LContent()], { type: 'text/typescript' });
      const blob6L = new Blob([generate6LContent()], { type: 'text/typescript' });

      const url4L = URL.createObjectURL(blob4L);
      const url5L = URL.createObjectURL(blob5L);
      const url6L = URL.createObjectURL(blob6L);

      // Create temporary download links
      const download = (url: string, filename: string) => {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      };

      download(url4L, 'curatedPuzzles4L.ts');
      download(url5L, 'curatedPuzzles5L.ts');
      download(url6L, 'curatedPuzzles6L.ts');

      toast({
        title: "Cleanup Complete",
        description: `Removed ${totalRemoved} failed puzzles. ${totalRemaining} valid puzzles remaining. Updated files downloaded.`,
      });

      // Clear validation results
      setValidationResults([]);

    } catch (error: any) {
      console.error('Cleanup error:', error);
      toast({
        title: "Cleanup Failed",
        description: error.message || "Failed to remove failed puzzles",
        variant: "destructive"
      });
    } finally {
      setRemoving(false);
    }
  };

  const importPuzzles = async () => {
    setImporting(true);
    
    try {
      // Prepare all puzzles for import (only valid ones if validation was run)
      let puzzlesToImport;
      
      if (validationResults.length > 0) {
        // Only import valid puzzles
        puzzlesToImport = validationResults
          .filter(r => r.valid)
          .map((r, index) => ({
            start: r.puzzle.start,
            goal: r.puzzle.goal,
            minDist: r.minDistance!,
            wordLength: r.puzzle.wordLength,
            index
          }));
      } else {
        // Import all (legacy behavior)
        puzzlesToImport = [
          ...CURATED_4L_PUZZLES.map((p, index) => ({
            start: p.start,
            goal: p.goal,
            minDist: p.minDist || 3,
            wordLength: 4,
            index
          })),
          ...CURATED_5L_PUZZLES.map((p, index) => ({
            start: p.start,
            goal: p.goal,
            minDist: p.minDist || 3,
            wordLength: 5,
            index
          })),
          ...CURATED_6L_PUZZLES.map((p, index) => ({
            start: p.start,
            goal: p.goal,
            minDist: p.minDist || 3,
            wordLength: 6,
            index
          }))
        ];
      }

      console.log(`Importing ${puzzlesToImport.length} puzzles to secure vault...`);

      const { data, error } = await supabase.functions.invoke('import-puzzles-to-vault', {
        body: { puzzles: puzzlesToImport }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Import Successful",
        description: `${data.imported} puzzles imported to secure vault. ${data.skipped} duplicates skipped.`,
      });

      // Reload stats
      await loadStats();

    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import puzzles",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Puzzle Vault</h1>
          <p className="text-muted-foreground">
            Secure storage for proprietary puzzle data
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Validation Card */}
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <CheckCircle2 className="h-6 w-6 text-blue-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">Validate Puzzles</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Test all curated puzzles with the new algorithm. Ensures solvability, 
                difficulty rating, and minimum 3-move requirement.
              </p>
              <Button 
                onClick={validateAllPuzzles} 
                disabled={validating}
                className="w-full"
                variant="outline"
              >
                {validating ? (
                  <>Validating...</>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Validate All Puzzles
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* Import Card */}
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">Import Puzzles</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Import curated puzzles into the secure database vault.
                {validationResults.length > 0 && " Only validated puzzles will be imported."}
              </p>
              <Button 
                onClick={importPuzzles} 
                disabled={importing}
                className="w-full"
              >
                {importing ? (
                  <>Importing...</>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    {validationResults.length > 0 ? "Import Valid Puzzles" : "Import All Puzzles"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* Stats Card */}
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <Database className="h-6 w-6 text-green-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">Vault Statistics</h3>
              {stats ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Puzzles:</span>
                    <span className="font-semibold">{stats.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">4-Letter:</span>
                    <span className="font-semibold">{stats.length4}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">5-Letter:</span>
                    <span className="font-semibold">{stats.length5}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">6-Letter:</span>
                    <span className="font-semibold">{stats.length6}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Click "Load Stats" to view vault statistics
                </p>
              )}
              <Button 
                onClick={loadStats} 
                variant="outline" 
                size="sm"
                className="w-full mt-4"
              >
                <Database className="mr-2 h-4 w-4" />
                Load Stats
              </Button>
            </div>
          </div>
        </Card>

        {/* Validation Results */}
        {validationResults.length > 0 && (
          <Card className="p-6 md:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Validation Results</h3>
              {validationResults.some(r => !r.valid) && (
                <Button
                  onClick={removeFailedPuzzles}
                  disabled={removing}
                  variant="destructive"
                  size="sm"
                >
                  {removing ? (
                    <>Removing...</>
                  ) : (
                    <>Remove Failed Puzzles</>
                  )}
                </Button>
              )}
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {validationResults.map((result, idx) => (
                <div 
                  key={idx}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    result.valid ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {result.valid ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <div className="font-medium">
                        {result.puzzle.start} → {result.puzzle.goal}
                        <Badge variant="outline" className="ml-2">{result.puzzle.wordLength}L</Badge>
                      </div>
                      {result.valid ? (
                        <div className="text-xs text-muted-foreground">
                          Distance: {result.minDistance}, Paths: {result.pathCount}
                        </div>
                      ) : (
                        <div className="text-xs text-red-500">{result.reason}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Summary:</span>
                <div className="flex gap-4">
                  <span className="text-green-500">
                    ✓ {validationResults.filter(r => r.valid).length} Valid
                  </span>
                  <span className="text-red-500">
                    ✗ {validationResults.filter(r => !r.valid).length} Failed
                  </span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Security Info Card */}
        <Card className="p-6 md:col-span-2">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg">
              <Lock className="h-6 w-6 text-blue-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">Security Features</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span><strong>Encrypted Storage:</strong> Puzzles stored securely in database with RLS protection</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span><strong>Rate Limiting:</strong> API endpoints limited to 100 requests/hour per user</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span><strong>One-at-a-Time Delivery:</strong> Only today's puzzle is served, preventing bulk extraction</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span><strong>Admin-Only Access:</strong> Only administrators can import or manage vault data</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span><strong>Audit Logging:</strong> All vault access is logged for security monitoring</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span><strong>Algorithm Validation:</strong> All puzzles validated for solvability and minimum 3-move requirement</span>
                </li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
