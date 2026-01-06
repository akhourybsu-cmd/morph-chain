import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trophy, Target, Zap, Award, Flame } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { loadRushStats } from "@/lib/rushStorage";

interface RushStatsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RushStats = ({ open, onOpenChange }: RushStatsProps) => {
  const stats = loadRushStats();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Rush Statistics</DialogTitle>
        </DialogHeader>
        
        {/* Daily Streak Section */}
        {(stats.dailyStreak > 0 || stats.maxDailyStreak > 0) && (
          <div className="rounded-lg border p-4 text-center bg-muted/30">
            <div className="flex justify-center gap-8">
              <div>
                <div className="flex items-center justify-center gap-2 text-primary">
                  <Flame className="h-5 w-5" />
                  <span className="text-2xl font-bold">{stats.dailyStreak}</span>
                </div>
                <p className="text-xs text-muted-foreground uppercase mt-1">Daily Streak</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Award className="h-5 w-5" />
                  <span className="text-2xl font-bold">{stats.maxDailyStreak}</span>
                </div>
                <p className="text-xs text-muted-foreground uppercase mt-1">Best Streak</p>
              </div>
            </div>
          </div>
        )}
        
        <Tabs defaultValue="normal" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="normal">Normal Mode</TabsTrigger>
            <TabsTrigger value="hard">Hard Mode</TabsTrigger>
          </TabsList>
          
          <TabsContent value="normal" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <StatCard
                icon={<Trophy className="h-5 w-5 text-primary" />}
                label="Games Played"
                value={stats.normal.gamesPlayed}
              />
              <StatCard
                icon={<Target className="h-5 w-5 text-primary" />}
                label="High Score"
                value={stats.normal.highScore.toLocaleString()}
              />
              <StatCard
                icon={<Award className="h-5 w-5 text-primary" />}
                label="Total Words"
                value={stats.normal.totalWords.toLocaleString()}
              />
              <StatCard
                icon={<Zap className="h-5 w-5 text-primary" />}
                label="Max Multiplier"
                value={`${stats.normal.maxMultiplier.toFixed(1)}x`}
              />
            </div>

            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Average Score</span>
                <span className="text-lg font-semibold">
                  {stats.normal.gamesPlayed > 0 
                    ? Math.round(stats.normal.totalScore / stats.normal.gamesPlayed).toLocaleString()
                    : '0'}
                </span>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="hard" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <StatCard
                icon={<Trophy className="h-5 w-5 text-primary" />}
                label="Games Played"
                value={stats.hard.gamesPlayed}
              />
              <StatCard
                icon={<Target className="h-5 w-5 text-primary" />}
                label="High Score"
                value={stats.hard.highScore.toLocaleString()}
              />
              <StatCard
                icon={<Award className="h-5 w-5 text-primary" />}
                label="Total Words"
                value={stats.hard.totalWords.toLocaleString()}
              />
              <StatCard
                icon={<Zap className="h-5 w-5 text-primary" />}
                label="Max Multiplier"
                value={`${stats.hard.maxMultiplier.toFixed(1)}x`}
              />
            </div>

            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Average Score</span>
                <span className="text-lg font-semibold">
                  {stats.hard.gamesPlayed > 0 
                    ? Math.round(stats.hard.totalScore / stats.hard.gamesPlayed).toLocaleString()
                    : '0'}
                </span>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="text-xs text-muted-foreground text-center pt-2">
          Sign in to sync your stats across devices
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
