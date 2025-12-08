import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AddToHomeScreen } from "@/components/AddToHomeScreen";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Trophy } from "lucide-react";
import { useState } from "react";
import { backgroundThemes, BackgroundTheme } from "@/components/SettingsModal";
import { GamesNavigation } from "@/components/shared/GamesNavigation";

interface GameMenuSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hardMode: boolean;
  onToggleHardMode: () => void;
  colorblindMode: boolean;
  onToggleColorblindMode: () => void;
  vibration: boolean;
  onToggleVibration: () => void;
  useOnScreenKeyboard: boolean;
  onToggleOnScreenKeyboard: () => void;
  backgroundTheme: BackgroundTheme;
  onChangeBackgroundTheme: (theme: BackgroundTheme) => void;
  onResetData: () => void;
  onOpenAchievements?: () => void;
}

export const GameMenuSheet = ({
  open,
  onOpenChange,
  hardMode,
  onToggleHardMode,
  colorblindMode,
  onToggleColorblindMode,
  vibration,
  onToggleVibration,
  useOnScreenKeyboard,
  onToggleOnScreenKeyboard,
  backgroundTheme,
  onChangeBackgroundTheme,
  onResetData,
  onOpenAchievements,
}: GameMenuSheetProps) => {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[280px] sm:w-[320px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 py-4">
          {/* Games Section */}
          <GamesNavigation currentGame="chain" onNavigate={() => onOpenChange(false)} />

          <Separator />

          {/* Chain-specific: Achievements */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-2">MORPH CHAIN</h3>
            <div className="space-y-1">
              {onOpenAchievements && (
                <button
                  onClick={() => {
                    onOpenAchievements();
                    onOpenChange(false);
                  }}
                  className="w-full text-left px-3 py-3 rounded-lg hover:bg-muted transition-colors flex items-center gap-2"
                >
                  <Trophy className="w-4 h-4 text-chain" />
                  Achievements
                </button>
              )}
            </div>
          </div>

          <Separator />

          {/* Settings Section - Collapsible */}
          <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-1 hover:bg-muted/50 rounded-md">
              <h3 className="font-semibold text-sm">Settings</h3>
              <ChevronDown className={`h-4 w-4 transition-transform ${settingsOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            
            <CollapsibleContent className="space-y-4 pt-4">
              <div className="flex items-center justify-between px-2">
                <div className="space-y-0.5">
                  <Label htmlFor="hard-mode" className="text-sm">
                    Hard Mode
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Move closer each step
                  </p>
                </div>
                <Switch
                  id="hard-mode"
                  checked={hardMode}
                  onCheckedChange={onToggleHardMode}
                />
              </div>

              <div className="flex items-center justify-between px-2">
                <div className="space-y-0.5">
                  <Label htmlFor="colorblind-mode" className="text-sm">
                    Colorblind Mode
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Use shapes
                  </p>
                </div>
                <Switch
                  id="colorblind-mode"
                  checked={colorblindMode}
                  onCheckedChange={onToggleColorblindMode}
                />
              </div>

              <div className="flex items-center justify-between px-2">
                <div className="space-y-0.5">
                  <Label htmlFor="vibration" className="text-sm">
                    Vibration
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Haptic feedback
                  </p>
                </div>
                <Switch
                  id="vibration"
                  checked={vibration}
                  onCheckedChange={onToggleVibration}
                />
              </div>

              <div className="flex items-center justify-between px-2">
                <div className="space-y-0.5">
                  <Label htmlFor="onscreen-keyboard" className="text-sm">
                    On-Screen Keyboard
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Show keyboard overlay
                  </p>
                </div>
                <Switch
                  id="onscreen-keyboard"
                  checked={useOnScreenKeyboard}
                  onCheckedChange={onToggleOnScreenKeyboard}
                />
              </div>

              <Separator />

              <div className="space-y-3 px-2">
                <Label className="text-sm">Background Theme</Label>
                <RadioGroup value={backgroundTheme} onValueChange={onChangeBackgroundTheme}>
                  {Object.entries(backgroundThemes).map(([key, { name }]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <RadioGroupItem value={key} id={key} />
                      <Label htmlFor={key} className="text-xs font-normal cursor-pointer">
                        {name}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <Separator />

              <div className="flex flex-col gap-2 px-2">
                <Label className="text-sm">Install App</Label>
                <AddToHomeScreen />
                <p className="text-xs text-muted-foreground">
                  Add to home screen
                </p>
              </div>

              <Separator />

              <div className="space-y-2 px-2">
                <Label className="text-sm text-destructive">Danger Zone</Label>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={onResetData}
                >
                  Reset Local Data
                </Button>
                <p className="text-xs text-muted-foreground">
                  Erase stats and progress
                </p>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </SheetContent>
    </Sheet>
  );
};
