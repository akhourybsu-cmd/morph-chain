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

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hardMode: boolean;
  onToggleHardMode: () => void;
  colorblindMode: boolean;
  onToggleColorblindMode: () => void;
  vibration: boolean;
  onToggleVibration: () => void;
  onResetData: () => void;
}

export const SettingsModal = ({
  open,
  onOpenChange,
  hardMode,
  onToggleHardMode,
  colorblindMode,
  onToggleColorblindMode,
  vibration,
  onToggleVibration,
  onResetData,
}: SettingsModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="hard-mode" className="text-base">
                Hard Mode
              </Label>
              <p className="text-sm text-muted-foreground">
                Each step must move closer to the goal
              </p>
            </div>
            <Switch
              id="hard-mode"
              checked={hardMode}
              onCheckedChange={onToggleHardMode}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="colorblind-mode" className="text-base">
                Colorblind Mode
              </Label>
              <p className="text-sm text-muted-foreground">
                Use shapes instead of colors
              </p>
            </div>
            <Switch
              id="colorblind-mode"
              checked={colorblindMode}
              onCheckedChange={onToggleColorblindMode}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="vibration" className="text-base">
                Vibration
              </Label>
              <p className="text-sm text-muted-foreground">
                Haptic feedback on mobile
              </p>
            </div>
            <Switch
              id="vibration"
              checked={vibration}
              onCheckedChange={onToggleVibration}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-base text-destructive">Danger Zone</Label>
            <Button
              variant="destructive"
              className="w-full"
              onClick={onResetData}
            >
              Reset Local Data
            </Button>
            <p className="text-xs text-muted-foreground">
              This will erase all your stats and progress
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
