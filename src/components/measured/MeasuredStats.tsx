import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Trophy, 
  Target, 
  Zap, 
  Flame, 
  Award,
  RotateCcw,
  TrendingUp,
  Crosshair
} from 'lucide-react';
import { loadMeasuredStats, resetMeasuredStats, MeasuredStats as MeasuredStatsType } from '@/lib/measured/statsStorage';
import { toast } from 'sonner';

interface MeasuredStatsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MeasuredStats({ open, onOpenChange }: MeasuredStatsProps) {
  const [stats] = useState<MeasuredStatsType>(loadMeasuredStats());
  
  const handleReset = () => {
    if (confirm('Reset all Measured stats? This cannot be undone.')) {
      resetMeasuredStats();
      toast.success('Stats reset');
      onOpenChange(false);
    }
  };
  
  const bandLabels = [
    { key: 'deadOn', label: 'Dead On', emoji: '🎯', color: 'bg-green-500' },
    { key: 'sharp', label: 'Sharp', emoji: '✨', color: 'bg-emerald-400' },
    { key: 'close', label: 'Close', emoji: '👍', color: 'bg-yellow-400' },
    { key: 'warm', label: 'Warm', emoji: '🔥', color: 'bg-orange-400' },
    { key: 'wide', label: 'Wide', emoji: '📏', color: 'bg-red-400' },
  ] as const;
  
  const maxBandCount = Math.max(
    ...Object.values(stats.bandDistribution),
    1
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-md max-h-[90vh] overflow-y-auto bg-measured-card border-measured-card-border"
      >
        <DialogHeader>
          <DialogTitle className="font-playfair text-xl text-measured-text-primary">
            Your Measured Stats
          </DialogTitle>
        </DialogHeader>

        {/* Hero KPIs */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<Trophy className="h-5 w-5 text-measured-accent" />}
            label="Games Played"
            value={stats.gamesPlayed}
          />
          <StatCard
            icon={<Target className="h-5 w-5 text-measured-accent" />}
            label="Exact Matches"
            value={stats.exactMatches}
          />
          <StatCard
            icon={<TrendingUp className="h-5 w-5 text-measured-accent" />}
            label="Best Score"
            value={stats.bestScore}
          />
          <StatCard
            icon={<Crosshair className="h-5 w-5 text-measured-accent" />}
            label="Avg Score"
            value={stats.averageScore}
          />
        </div>

        {/* Streak */}
        {(stats.currentStreak > 0 || stats.maxStreak > 0) && (
          <div className="rounded-lg border p-4 text-center bg-measured-page border-measured-card-border">
            <div className="flex justify-center gap-8">
              <div>
                <div className="flex items-center justify-center gap-2 text-measured-accent">
                  <Flame className="h-5 w-5" />
                  <span className="text-2xl font-bold">{stats.currentStreak}</span>
                </div>
                <p className="text-xs text-measured-text-muted uppercase mt-1">Current Streak</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-2 text-measured-text-secondary">
                  <Award className="h-5 w-5" />
                  <span className="text-2xl font-bold">{stats.maxStreak}</span>
                </div>
                <p className="text-xs text-measured-text-muted uppercase mt-1">Best Streak</p>
              </div>
            </div>
          </div>
        )}

        {/* Band Distribution */}
        <div className="rounded-lg border p-4 bg-measured-page border-measured-card-border">
          <h3 className="font-semibold text-sm mb-3 text-measured-text-primary flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Accuracy Distribution
          </h3>
          <div className="space-y-2">
            {bandLabels.map(({ key, label, emoji, color }) => {
              const count = stats.bandDistribution[key];
              const widthPct = count > 0 ? Math.max((count / maxBandCount) * 100, 8) : 0;
              return (
                <div key={key} className="flex items-center gap-2 text-sm">
                  <span className="w-20 text-measured-text-muted flex items-center gap-1">
                    <span>{emoji}</span>
                    <span>{label}</span>
                  </span>
                  <div className="flex-1 h-6 bg-measured-card rounded overflow-hidden border border-measured-card-border">
                    <div
                      className={`h-full ${color} transition-all`}
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-measured-text-primary font-medium">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Additional Stats */}
        {stats.bestErrorPercent !== null && (
          <div className="rounded-lg border p-4 bg-measured-page border-measured-card-border">
            <div className="flex justify-between items-center text-sm">
              <span className="text-measured-text-muted">Best Accuracy</span>
              <span className="text-measured-text-primary font-medium">
                {stats.bestErrorPercent === 0 
                  ? 'Perfect!' 
                  : `${stats.bestErrorPercent}% error`}
              </span>
            </div>
          </div>
        )}

        {/* Reset Button */}
        <Button
          variant="outline"
          onClick={handleReset}
          className="w-full border-measured-card-border text-measured-text-secondary hover:bg-measured-page"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset Stats
        </Button>

        <p className="text-xs text-measured-text-muted text-center">
          Sign in to sync stats across devices
        </p>
      </DialogContent>
    </Dialog>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}

function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <div className="rounded-lg border p-4 text-center space-y-2 bg-measured-page border-measured-card-border">
      <div className="flex justify-center">{icon}</div>
      <div>
        <p className="text-2xl font-semibold text-measured-text-primary">{value}</p>
        <p className="text-xs text-measured-text-muted uppercase tracking-wide">{label}</p>
      </div>
    </div>
  );
}
