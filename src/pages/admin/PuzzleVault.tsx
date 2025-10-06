import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Upload, Database, Lock } from "lucide-react";
import { CURATED_4L_PUZZLES } from "@/lib/curatedPuzzles4L";
import { CURATED_5L_PUZZLES } from "@/lib/curatedPuzzles5L";
import { CURATED_6L_PUZZLES } from "@/lib/curatedPuzzles6L";

export default function PuzzleVault() {
  const { toast } = useToast();
  const [importing, setImporting] = useState(false);
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

  const importPuzzles = async () => {
    setImporting(true);
    
    try {
      // Prepare all puzzles for import
      const allPuzzles = [
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

      console.log(`Importing ${allPuzzles.length} puzzles to secure vault...`);

      const { data, error } = await supabase.functions.invoke('import-puzzles-to-vault', {
        body: { puzzles: allPuzzles }
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
        {/* Import Card */}
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">Import Puzzles</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Import curated puzzles from client-side files into the secure database vault.
                This protects your proprietary puzzle data from scraping.
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
                    Import All Puzzles
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
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
