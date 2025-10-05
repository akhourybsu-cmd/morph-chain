import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface StatsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stats: {
    played: number;
    winPercent: number;
    currentStreak: number;
    maxStreak: number;
    distribution: number[];
    hardModeStreak: number;
  };
}

export const StatsModal = ({ open, onOpenChange, stats }: StatsModalProps) => {
  const maxCount = Math.max(...stats.distribution, 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Your Stats</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-4 gap-4">
            <StatBox label="Played" value={stats.played} />
            <StatBox label="Win %" value={`${stats.winPercent}%`} />
            <StatBox label="Current" value={stats.currentStreak} />
            <StatBox label="Max" value={stats.maxStreak} />
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium">Move Distribution</h3>
            <div className="space-y-2">
              {stats.distribution.map((count, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-sm w-4 text-muted-foreground">
                    {index + 1}
                  </span>
                  <div className="flex-1 h-6 bg-muted/30 rounded overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{
                        width: `${count === 0 ? 0 : Math.max((count / maxCount) * 100, 8)}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm w-8 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {stats.hardModeStreak > 0 && (
            <div className="text-center p-3 bg-card border border-border rounded-lg">
              <p className="text-sm text-muted-foreground">Hard Mode Streak</p>
              <p className="text-2xl font-semibold">{stats.hardModeStreak}</p>
            </div>
          )}

          <p className="text-xs text-center text-muted-foreground">
            Stats reset on this device only unless signed in
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const StatBox = ({ label, value }: { label: string; value: string | number }) => {
  return (
    <div className="text-center space-y-1">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
    </div>
  );
};
