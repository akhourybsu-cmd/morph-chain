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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Morph Rush Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Hard Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Label htmlFor="hard-mode" className="text-base">
                  Hard Mode
                </Label>
                {hardMode && (
                  <div className="px-2 py-0.5 bg-destructive/10 text-destructive rounded text-xs font-semibold">
                    ACTIVE
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
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
              <Separator />
              
              <div className="space-y-2">
                <Label className="text-base flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-primary" />
                  Leaderboard
                </Label>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    onViewLeaderboard();
                    onOpenChange(false);
                  }}
                >
                  View Daily Leaderboard
                </Button>
                <p className="text-xs text-muted-foreground">
                  Separate leaderboards for Normal and Hard mode
                </p>
              </div>
            </>
          )}

          <Separator />

          {/* Game Info */}
          <div className="space-y-2">
            <Label className="text-base">Current Mode</Label>
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <Zap className="h-4 w-4 text-primary" />
              <span className="font-medium capitalize">{mode} Mode</span>
            </div>
            {mode === 'practice' && (
              <p className="text-xs text-muted-foreground">
                Practice mode has no timer and doesn't submit to leaderboard
              </p>
            )}
          </div>

          <Separator />

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
            <p className="text-xs text-muted-foreground">
              This will erase all your Rush statistics and high scores
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
