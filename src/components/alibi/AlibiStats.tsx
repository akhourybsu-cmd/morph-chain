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
  Clock, 
  Flame, 
  Award,
  RotateCcw,
  CheckCircle,
  Sparkles
} from 'lucide-react';
import { loadStats, getDefaultStats } from '@/lib/alibi/storage';
import { AlibiStats as AlibiStatsType } from '@/lib/alibi/types';
import { toast } from 'sonner';

interface AlibiStatsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AlibiStats({ open, onOpenChange }: AlibiStatsProps) {
  const [stats] = useState<AlibiStatsType>(loadStats());
  
  const handleReset = () => {
    if (confirm('Reset all Alibi stats? This cannot be undone.')) {
      localStorage.removeItem('alibi_stats');
      toast.success('Stats reset');
      onOpenChange(false);
    }
  };
  
  const winRate = stats.gamesPlayed > 0 
    ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) 
    : 0;
    
  const formatTime = (ms: number): string => {
    if (ms === 0) return '—';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-playfair text-xl">
            Your Alibi Stats
          </DialogTitle>
        </DialogHeader>

        {/* Hero KPIs */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<Trophy className="h-5 w-5 text-primary" />}
            label="Games Played"
            value={stats.gamesPlayed}
          />
          <StatCard
            icon={<CheckCircle className="h-5 w-5 text-primary" />}
            label="Games Won"
            value={stats.gamesWon}
          />
          <StatCard
            icon={<Target className="h-5 w-5 text-primary" />}
            label="Win Rate"
            value={`${winRate}%`}
          />
          <StatCard
            icon={<Sparkles className="h-5 w-5 text-primary" />}
            label="Perfect Games"
            value={stats.perfectGames}
            subtext="No hints used"
          />
        </div>

        {/* Streak */}
        {(stats.currentStreak > 0 || stats.maxStreak > 0) && (
          <div className="rounded-lg border p-4 text-center bg-muted/30">
            <div className="flex justify-center gap-8">
              <div>
                <div className="flex items-center justify-center gap-2 text-primary">
                  <Flame className="h-5 w-5" />
                  <span className="text-2xl font-bold">{stats.currentStreak}</span>
                </div>
                <p className="text-xs text-muted-foreground uppercase mt-1">Current Streak</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Award className="h-5 w-5" />
                  <span className="text-2xl font-bold">{stats.maxStreak}</span>
                </div>
                <p className="text-xs text-muted-foreground uppercase mt-1">Best Streak</p>
              </div>
            </div>
          </div>
        )}

        {/* Time Stats */}
        <div className="rounded-lg border p-4 bg-muted/30">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Time Stats
          </h3>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Average Solve Time</span>
            <span className="font-medium">{formatTime(stats.averageTime)}</span>
          </div>
        </div>

        {/* Reset Button */}
        <Button
          variant="outline"
          onClick={handleReset}
          className="w-full"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset Stats
        </Button>

        <p className="text-xs text-muted-foreground text-center">
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
  subtext?: string;
}

function StatCard({ icon, label, value, subtext }: StatCardProps) {
  return (
    <div className="rounded-lg border p-4 text-center space-y-2 bg-muted/30">
      <div className="flex justify-center">{icon}</div>
      <div>
        <p className="text-2xl font-semibold">{value}</p>
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
        {subtext && <p className="text-xs text-muted-foreground mt-1">{subtext}</p>}
      </div>
    </div>
  );
}
