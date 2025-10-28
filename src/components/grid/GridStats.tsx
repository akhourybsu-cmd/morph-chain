import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trophy, Target, TrendingUp, Percent, Hash, CheckCircle, Type, Zap, Grid3x3 } from "lucide-react";
import { loadGridStats, loadGridAlias, saveGridAlias, resetGridStats, GridStats } from "@/lib/gridStorage";
import { toast } from "sonner";

interface GridStatsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const GridStatsModal = ({ open, onOpenChange }: GridStatsModalProps) => {
  const [stats] = useState<GridStats>(loadGridStats());
  const [alias, setAlias] = useState(loadGridAlias() || "");
  const [showAliasInput, setShowAliasInput] = useState(false);
  
  const handleSaveAlias = () => {
    if (alias.trim().length > 0 && alias.trim().length <= 12) {
      saveGridAlias(alias.trim());
      setShowAliasInput(false);
      toast.success("Alias saved!");
    } else {
      toast.error("Alias must be 1-12 characters");
    }
  };
  
  const handleReset = () => {
    if (confirm("Reset all Grid stats? This cannot be undone.")) {
      resetGridStats();
      toast.success("Stats reset");
      onOpenChange(false);
    }
  };
  
  const histogramBuckets = ['0-10', '11-15', '16-20', '21-25', '26-30', '30+'];
  const maxHistValue = Math.max(...histogramBuckets.map(b => stats.movesHistogram[b] || 0), 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Your Lifetime Stats</DialogTitle>
        </DialogHeader>

        {/* Hero KPIs */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<Trophy className="h-5 w-5" />}
            label="Best Moves"
            value={stats.bestMoves ?? "—"}
            subtext={stats.bestMovesDate ? `on ${stats.bestMovesDate}` : undefined}
          />
          <StatCard
            icon={<Target className="h-5 w-5" />}
            label="Avg Moves"
            value={stats.avgMovesCompleted ? Math.round(stats.avgMovesCompleted) : "—"}
          />
          <StatCard
            icon={<TrendingUp className="h-5 w-5" />}
            label="Median Moves"
            value={stats.medianMovesCompleted ? Math.round(stats.medianMovesCompleted) : "—"}
          />
          <StatCard
            icon={<Percent className="h-5 w-5" />}
            label="Completion Rate"
            value={`${Math.round(stats.completionRate * 100)}%`}
          />
          <StatCard
            icon={<Hash className="h-5 w-5" />}
            label="Games Played"
            value={stats.gamesPlayed}
          />
          <StatCard
            icon={<CheckCircle className="h-5 w-5" />}
            label="Games Completed"
            value={stats.gamesCompleted}
          />
        </div>

        {/* Word & Tile Insights */}
        <Card>
          <CardContent className="pt-6 space-y-3">
            <h3 className="font-semibold text-sm mb-3">Word & Tile Insights</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Type className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Longest Word:</span>
                <span className="font-medium">{stats.longestWord || "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Type className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Most Used:</span>
                <span className="font-medium">{stats.mostUsedLetter || "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Total Words:</span>
                <span className="font-medium">{stats.totalWordsAllGames}</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Power Uses:</span>
                <span className="font-medium">{stats.totalPowerUses}</span>
              </div>
              <div className="flex items-center gap-2 col-span-2">
                <Grid3x3 className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Stabilized Freed:</span>
                <span className="font-medium">{stats.totalStabilizedFreed}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Moves Distribution */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold text-sm mb-3">Moves Distribution</h3>
            <div className="space-y-2">
              {histogramBuckets.map((bucket) => {
                const count = stats.movesHistogram[bucket] || 0;
                const widthPct = count > 0 ? Math.max((count / maxHistValue) * 100, 8) : 0;
                return (
                  <div key={bucket} className="flex items-center gap-2 text-sm">
                    <span className="w-12 text-muted-foreground">{bucket}</span>
                    <div className="flex-1 h-6 bg-muted/30 rounded overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                    <span className="w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Streak */}
        {stats.streakDays > 0 && (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">Daily Completion Streak</p>
              <p className="text-3xl font-semibold">{stats.streakDays} days</p>
            </CardContent>
          </Card>
        )}

        {/* History */}
        {stats.completedGames.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold text-sm mb-3">Last 10 Daily Results</h3>
              <div className="space-y-2 text-sm">
                {stats.completedGames.slice(-10).reverse().map((game, i) => (
                  <div key={i} className="flex justify-between items-center py-1 border-b border-border/50 last:border-0">
                    <span className="text-muted-foreground">{game.dateSeed}</span>
                    <div className="flex gap-3 text-xs">
                      <span>{game.moves} moves</span>
                      <span className="text-muted-foreground">{game.wordsUsed} words</span>
                      {game.timeToCompleteMs && (
                        <span className="text-muted-foreground">
                          {Math.floor(game.timeToCompleteMs / 60000)}:{String(Math.floor((game.timeToCompleteMs % 60000) / 1000)).padStart(2, '0')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="space-y-2">
          {!showAliasInput ? (
            <Button variant="outline" className="w-full" onClick={() => setShowAliasInput(true)}>
              Set Alias / Initials
            </Button>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="alias">Leaderboard Alias (1-12 chars)</Label>
              <div className="flex gap-2">
                <Input
                  id="alias"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  maxLength={12}
                  placeholder="e.g., AK"
                />
                <Button onClick={handleSaveAlias}>Save</Button>
                <Button variant="ghost" onClick={() => setShowAliasInput(false)}>Cancel</Button>
              </div>
            </div>
          )}
          
          <Button variant="destructive" className="w-full" onClick={handleReset}>
            Reset Stats
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
}

const StatCard = ({ icon, label, value, subtext }: StatCardProps) => {
  return (
    <Card>
      <CardContent className="pt-6 text-center space-y-2">
        <div className="flex justify-center text-muted-foreground">{icon}</div>
        <div>
          <p className="text-2xl font-semibold">{value}</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
          {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
        </div>
      </CardContent>
    </Card>
  );
};
