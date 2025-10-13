import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trophy, Target, Zap, Award } from "lucide-react";

interface RushStatsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RushStats = ({ open, onOpenChange }: RushStatsProps) => {
  // TODO: Load actual stats from storage/Supabase
  const stats = {
    gamesPlayed: 0,
    highScore: 0,
    totalWords: 0,
    maxMultiplier: 1.0,
    averageScore: 0,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Rush Statistics</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              icon={<Trophy className="h-5 w-5 text-primary" />}
              label="Games Played"
              value={stats.gamesPlayed}
            />
            <StatCard
              icon={<Target className="h-5 w-5 text-primary" />}
              label="High Score"
              value={stats.highScore.toLocaleString()}
            />
            <StatCard
              icon={<Award className="h-5 w-5 text-primary" />}
              label="Total Words"
              value={stats.totalWords.toLocaleString()}
            />
            <StatCard
              icon={<Zap className="h-5 w-5 text-primary" />}
              label="Max Multiplier"
              value={`${stats.maxMultiplier.toFixed(1)}x`}
            />
          </div>

          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Average Score</span>
              <span className="text-lg font-semibold">{stats.averageScore.toLocaleString()}</span>
            </div>
          </div>

          <div className="text-xs text-muted-foreground text-center pt-2">
            Sign in to sync your stats across devices
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}

const StatCard = ({ icon, label, value }: StatCardProps) => {
  return (
    <div className="p-4 bg-muted/30 rounded-lg space-y-2">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
};
