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
import { ChevronDown, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { backgroundThemes, BackgroundTheme } from "@/components/SettingsModal";
import { MorphChainTitle, MorphPrismTitle, MorphRushTitle } from "@/components/GameTitles";

interface GameMenuSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hardMode: boolean;
  onToggleHardMode: () => void;
  colorblindMode: boolean;
  onToggleColorblindMode: () => void;
  vibration: boolean;
  onToggleVibration: () => void;
  backgroundTheme: BackgroundTheme;
  onChangeBackgroundTheme: (theme: BackgroundTheme) => void;
  onResetData: () => void;
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
  backgroundTheme,
  onChangeBackgroundTheme,
  onResetData,
}: GameMenuSheetProps) => {
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleNavigate = (path: string) => {
    navigate(path);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[280px] sm:w-[320px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 py-4">
          {/* Morph Games Section */}
          <div className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start px-2 py-1 h-auto"
              onClick={() => handleNavigate("/")}
            >
              <Home className="h-4 w-4 mr-2 text-primary" />
              <h3 className="font-semibold text-sm">Morph Games</h3>
            </Button>

            <div className="pl-4 space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start text-sm h-auto py-2"
                onClick={() => handleNavigate("/chain")}
              >
                <MorphChainTitle className="text-base" />
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start text-sm h-auto py-2"
                onClick={() => handleNavigate("/rush?mode=daily")}
              >
                <MorphRushTitle className="text-base" />
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start text-sm h-auto py-2"
                onClick={() => handleNavigate("/prism")}
              >
                <MorphPrismTitle className="text-base" />
              </Button>
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