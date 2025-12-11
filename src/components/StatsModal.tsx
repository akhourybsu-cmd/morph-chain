import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LengthStats {
  played: number;
  won: number;
  currentStreak: number;
  maxStreak: number;
  distribution: number[];
}

interface StatsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stats: {
    overall: {
      played: number;
      won: number;
      currentStreak: number;
      maxStreak: number;
      distribution: number[];
      hardModeStreak: number;
    };
    byLength: {
      4: LengthStats;
      5: LengthStats;
    };
  };
}

export const StatsModal = ({ open, onOpenChange, stats }: StatsModalProps) => {
  const renderStatsForLength = (lengthStats: LengthStats & { hardModeStreak?: number }) => {
    const maxCount = Math.max(...lengthStats.distribution, 1);
    const winPercent = lengthStats.played > 0 ? Math.round((lengthStats.won / lengthStats.played) * 100) : 0;

    return (
      <div className="space-y-6 py-4">
        <div className="grid grid-cols-4 gap-4">
          <StatBox label="Played" value={lengthStats.played} />
          <StatBox label="Win %" value={`${winPercent}%`} />
          <StatBox label="Current" value={lengthStats.currentStreak} />
          <StatBox label="Max" value={lengthStats.maxStreak} />
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-[hsl(var(--chain-text-primary))]">Move Distribution</h3>
          <div className="space-y-2">
            {lengthStats.distribution.map((count, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-sm w-4 text-[hsl(var(--chain-text-muted))]">
                  {index + 1}
                </span>
                <div className="flex-1 h-6 bg-[hsl(var(--chain-card-bg))] rounded overflow-hidden border border-[hsl(var(--chain-card-border))]">
                  <div
                    className="h-full bg-[hsl(var(--chain-accent))] transition-all duration-300"
                    style={{
                      width: `${count === 0 ? 0 : Math.max((count / maxCount) * 100, 8)}%`,
                    }}
                  />
                </div>
                <span className="text-sm w-8 text-right text-[hsl(var(--chain-text-primary))]">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {lengthStats.hardModeStreak !== undefined && lengthStats.hardModeStreak > 0 && (
          <div className="text-center p-3 bg-[hsl(var(--chain-pill-bg))] border border-[hsl(var(--chain-card-border))] rounded-lg">
            <p className="text-sm text-[hsl(var(--chain-text-muted))]">Hard Mode Streak</p>
            <p className="text-2xl font-semibold text-[hsl(var(--chain-text-primary))]">{lengthStats.hardModeStreak}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-md bg-[hsl(var(--chain-card-bg))] border-[hsl(var(--chain-card-border))]"
        style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
      >
        <DialogHeader>
          <DialogTitle className="font-playfair text-xl text-[hsl(var(--chain-text-primary))]">
            Your Stats
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overall" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-[hsl(var(--chain-pill-bg))]">
            <TabsTrigger 
              value="overall"
              className="data-[state=active]:bg-[hsl(var(--chain-card-bg))] data-[state=active]:text-[hsl(var(--chain-accent))] text-[hsl(var(--chain-text-secondary))]"
            >
              Overall
            </TabsTrigger>
            <TabsTrigger 
              value="4"
              className="data-[state=active]:bg-[hsl(var(--chain-card-bg))] data-[state=active]:text-[hsl(var(--chain-accent))] text-[hsl(var(--chain-text-secondary))]"
            >
              4L
            </TabsTrigger>
            <TabsTrigger 
              value="5"
              className="data-[state=active]:bg-[hsl(var(--chain-card-bg))] data-[state=active]:text-[hsl(var(--chain-accent))] text-[hsl(var(--chain-text-secondary))]"
            >
              5L
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overall">
            {renderStatsForLength(stats.overall)}
          </TabsContent>

          <TabsContent value="4">
            {renderStatsForLength(stats.byLength[4])}
          </TabsContent>

          <TabsContent value="5">
            {renderStatsForLength(stats.byLength[5])}
          </TabsContent>
        </Tabs>

        <p className="text-xs text-center text-[hsl(var(--chain-text-muted))]">
          Stats reset on this device only unless signed in
        </p>
      </DialogContent>
    </Dialog>
  );
};

const StatBox = ({ label, value }: { label: string; value: string | number }) => {
  return (
    <div className="text-center space-y-1">
      <p className="text-2xl font-semibold text-[hsl(var(--chain-text-primary))]">{value}</p>
      <p className="text-xs text-[hsl(var(--chain-text-muted))] uppercase tracking-wide">
        {label}
      </p>
    </div>
  );
};
