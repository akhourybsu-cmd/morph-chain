import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trophy, Target, TrendingUp, Percent, Hash, CheckCircle, Type, Zap, Grid3x3, Award } from "lucide-react";
import { loadGridStats, loadGridAlias, saveGridAlias, resetGridStats, GridStats } from "@/lib/gridStorage";
import { toast } from "sonner";
import { MEDAL_CONFIGS, MedalType } from "@/lib/gridAchievements";

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
      <DialogContent 
        className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-[hsl(var(--grid-card-bg))] border-[hsl(var(--grid-card-border))]"
        style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
      >
        <DialogHeader>
          <DialogTitle className="font-playfair text-xl text-[hsl(var(--grid-text-primary))]">
            Your Lifetime Stats
          </DialogTitle>
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

          {/* Medals Section */}
          <div 
            className="rounded-lg border p-4 bg-[hsl(var(--grid-pill-bg))] border-[hsl(var(--grid-card-border))]"
          >
            <h3 className="font-semibold text-sm mb-3 text-[hsl(var(--grid-text-primary))] flex items-center gap-2">
              <Award className="h-4 w-4" />
              Medals Earned
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {(['platinum', 'gold', 'silver', 'bronze'] as MedalType[]).map((medalType) => {
                const config = MEDAL_CONFIGS[medalType];
                const count = stats.medals?.[medalType] || 0;
                return (
                  <div 
                    key={medalType}
                    className={`text-center p-3 rounded-lg border ${config.bgClass} ${config.borderClass}`}
                  >
                    <div className="text-2xl mb-1">{config.emoji}</div>
                    <div className={`text-xl font-bold ${config.textClass}`}>{count}</div>
                    <div className="text-xs text-[hsl(var(--grid-text-muted))]">{config.label}</div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 text-xs text-[hsl(var(--grid-text-muted))] text-center">
              💎 ≤8 moves • 🥇 9-12 • 🥈 13-15 • 🥉 16+
            </div>
          </div>
        <div 
          className="rounded-lg border p-4 bg-[hsl(var(--grid-pill-bg))] border-[hsl(var(--grid-card-border))]"
        >
          <h3 className="font-semibold text-sm mb-3 text-[hsl(var(--grid-text-primary))]">Word & Tile Insights</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Type className="h-4 w-4 text-[hsl(var(--grid-text-muted))]" />
              <span className="text-[hsl(var(--grid-text-muted))]">Longest Word:</span>
              <span className="font-medium text-[hsl(var(--grid-text-primary))]">{stats.longestWord || "—"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Type className="h-4 w-4 text-[hsl(var(--grid-text-muted))]" />
              <span className="text-[hsl(var(--grid-text-muted))]">Most Used:</span>
              <span className="font-medium text-[hsl(var(--grid-text-primary))]">{stats.mostUsedLetter || "—"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-[hsl(var(--grid-text-muted))]" />
              <span className="text-[hsl(var(--grid-text-muted))]">Total Words:</span>
              <span className="font-medium text-[hsl(var(--grid-text-primary))]">{stats.totalWordsAllGames}</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-[hsl(var(--grid-text-muted))]" />
              <span className="text-[hsl(var(--grid-text-muted))]">Power Uses:</span>
              <span className="font-medium text-[hsl(var(--grid-text-primary))]">{stats.totalPowerUses}</span>
            </div>
            <div className="flex items-center gap-2 col-span-2">
              <Grid3x3 className="h-4 w-4 text-[hsl(var(--grid-text-muted))]" />
              <span className="text-[hsl(var(--grid-text-muted))]">Stabilized Freed:</span>
              <span className="font-medium text-[hsl(var(--grid-text-primary))]">{stats.totalStabilizedFreed}</span>
            </div>
          </div>
        </div>

        {/* Moves Distribution */}
        <div 
          className="rounded-lg border p-4 bg-[hsl(var(--grid-pill-bg))] border-[hsl(var(--grid-card-border))]"
        >
          <h3 className="font-semibold text-sm mb-3 text-[hsl(var(--grid-text-primary))]">Moves Distribution</h3>
          <div className="space-y-2">
            {histogramBuckets.map((bucket) => {
              const count = stats.movesHistogram[bucket] || 0;
              const widthPct = count > 0 ? Math.max((count / maxHistValue) * 100, 8) : 0;
              return (
                <div key={bucket} className="flex items-center gap-2 text-sm">
                  <span className="w-12 text-[hsl(var(--grid-text-muted))]">{bucket}</span>
                  <div className="flex-1 h-6 bg-[hsl(var(--grid-card-bg))] rounded overflow-hidden border border-[hsl(var(--grid-card-border))]">
                    <div
                      className="h-full bg-[hsl(var(--grid-accent))] transition-all"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-[hsl(var(--grid-text-primary))]">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Streak */}
        {stats.streakDays > 0 && (
          <div 
            className="rounded-lg border p-4 text-center bg-[hsl(var(--grid-pill-bg))] border-[hsl(var(--grid-card-border))]"
          >
            <p className="text-sm text-[hsl(var(--grid-text-muted))]">Daily Completion Streak</p>
            <p className="text-3xl font-semibold text-[hsl(var(--grid-text-primary))]">{stats.streakDays} days</p>
          </div>
        )}

        {/* History */}
        {stats.completedGames.length > 0 && (
          <div 
            className="rounded-lg border p-4 bg-[hsl(var(--grid-pill-bg))] border-[hsl(var(--grid-card-border))]"
          >
            <h3 className="font-semibold text-sm mb-3 text-[hsl(var(--grid-text-primary))]">Last 10 Daily Results</h3>
            <div className="space-y-2 text-sm">
              {stats.completedGames.slice(-10).reverse().map((game, i) => (
                <div key={i} className="flex justify-between items-center py-1 border-b border-[hsl(var(--grid-divider))] last:border-0">
                  <span className="text-[hsl(var(--grid-text-muted))]">{game.dateSeed}</span>
                  <div className="flex gap-3 text-xs">
                    <span className="text-[hsl(var(--grid-text-primary))]">{game.moves} moves</span>
                    <span className="text-[hsl(var(--grid-text-muted))]">{game.wordsUsed} words</span>
                    {game.timeToCompleteMs && (
                      <span className="text-[hsl(var(--grid-text-muted))]">
                        {Math.floor(game.timeToCompleteMs / 60000)}:{String(Math.floor((game.timeToCompleteMs % 60000) / 1000)).padStart(2, '0')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          {!showAliasInput ? (
            <Button 
              variant="outline" 
              className="w-full border-[hsl(var(--grid-card-border))] text-[hsl(var(--grid-text-secondary))] hover:bg-[hsl(var(--grid-pill-bg))]" 
              onClick={() => setShowAliasInput(true)}
            >
              Set Alias / Initials
            </Button>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="alias" className="text-[hsl(var(--grid-text-secondary))]">Leaderboard Alias (1-12 chars)</Label>
              <div className="flex gap-2">
                <Input
                  id="alias"
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  maxLength={12}
                  placeholder="e.g., AK"
                  className="bg-[hsl(var(--grid-pill-bg))] border-[hsl(var(--grid-card-border))] text-[hsl(var(--grid-text-primary))]"
                />
                <Button 
                  onClick={handleSaveAlias}
                  className="bg-[hsl(var(--grid-accent))] hover:bg-[hsl(193,46%,28%)] text-white"
                >
                  Save
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setShowAliasInput(false)}
                  className="text-[hsl(var(--grid-text-secondary))]"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
          
          <Button 
            variant="destructive" 
            className="w-full" 
            onClick={handleReset}
          >
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
    <div 
      className="rounded-lg border p-4 text-center space-y-2 bg-[hsl(var(--grid-pill-bg))] border-[hsl(var(--grid-card-border))]"
    >
      <div className="flex justify-center text-[hsl(var(--grid-text-muted))]">{icon}</div>
      <div>
        <p className="text-2xl font-semibold text-[hsl(var(--grid-text-primary))]">{value}</p>
        <p className="text-xs text-[hsl(var(--grid-text-muted))] uppercase tracking-wide">{label}</p>
        {subtext && <p className="text-xs text-[hsl(var(--grid-text-muted))] mt-1">{subtext}</p>}
      </div>
    </div>
  );
};
