import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Trophy, Zap } from "lucide-react";

interface RushSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hardMode: boolean;
  onToggleHardMode: () => void;
  canToggleHardMode: boolean;
  onViewLeaderboard: () => void;
  onResetData: () => void;
  mode: 'daily' | 'practice';
}

export const RushSettingsModal = ({
  open,
  onOpenChange,
  hardMode,
  onToggleHardMode,
  canToggleHardMode,
  onViewLeaderboard,
  onResetData,
  mode,
}: RushSettingsModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-md bg-[hsl(var(--rush-card-bg))] border-[hsl(var(--rush-card-border))]"
        style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
      >
        <DialogHeader>
          <DialogTitle className="font-playfair text-xl text-[hsl(var(--rush-text-primary))]">
            Morph Rush Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Hard Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Label htmlFor="hard-mode" className="text-base text-[hsl(var(--rush-text-primary))]">
                  Hard Mode
                </Label>
                {hardMode && (
                  <div className="px-2 py-0.5 bg-[hsl(var(--rush-accent))]/10 text-[hsl(var(--rush-accent))] rounded text-xs font-semibold">
                    ACTIVE
                  </div>
                )}
              </div>
              <p className="text-sm text-[hsl(var(--rush-text-muted))]">
                {canToggleHardMode 
                  ? "Can't change the same letter position twice in a row"
                  : "Must be set before your first move"}
              </p>
            </div>
            <Switch
              id="hard-mode"
              checked={hardMode}
              onCheckedChange={onToggleHardMode}
              disabled={!canToggleHardMode}
            />
          </div>

          {/* View Leaderboard (Daily mode only) */}
          {mode === 'daily' && (
            <>
              <Separator className="bg-[hsl(var(--rush-divider))]" />
              
              <div className="space-y-2">
                <Label className="text-base flex items-center gap-2 text-[hsl(var(--rush-text-primary))]">
                  <Trophy className="h-4 w-4 text-[hsl(var(--rush-accent))]" />
                  Leaderboard
                </Label>
                <Button
                  variant="outline"
                  className="w-full border-[hsl(var(--rush-card-border))] text-[hsl(var(--rush-text-secondary))] hover:bg-[hsl(var(--rush-pill-bg))]"
                  onClick={() => {
                    onViewLeaderboard();
                    onOpenChange(false);
                  }}
                >
                  View Daily Leaderboard
                </Button>
                <p className="text-xs text-[hsl(var(--rush-text-muted))]">
                  Separate leaderboards for Normal and Hard mode
                </p>
              </div>
            </>
          )}

          <Separator className="bg-[hsl(var(--rush-divider))]" />

          {/* Game Info */}
          <div className="space-y-2">
            <Label className="text-base text-[hsl(var(--rush-text-primary))]">Current Mode</Label>
            <div className="flex items-center gap-2 p-3 bg-[hsl(var(--rush-pill-bg))] rounded-lg border border-[hsl(var(--rush-card-border))]">
              <Zap className="h-4 w-4 text-[hsl(var(--rush-accent))]" />
              <span className="font-medium capitalize text-[hsl(var(--rush-text-primary))]">{mode} Mode</span>
            </div>
            {mode === 'practice' && (
              <p className="text-xs text-[hsl(var(--rush-text-muted))]">
                Practice mode has no timer and doesn't submit to leaderboard
              </p>
            )}
          </div>

          <Separator className="bg-[hsl(var(--rush-divider))]" />

          {/* Danger Zone */}
          <div className="space-y-2">
            <Label className="text-base text-destructive">Danger Zone</Label>
            <Button
              variant="destructive"
              className="w-full"
              onClick={onResetData}
            >
              Reset Rush Stats
            </Button>
            <p className="text-xs text-[hsl(var(--rush-text-muted))]">
              This will erase all your Rush statistics and high scores
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
