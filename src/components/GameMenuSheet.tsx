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
import { AddToHomeScreen } from "@/components/AddToHomeScreen";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Trophy, Settings, User } from "lucide-react";
import { useState, useEffect } from "react";
import { GamesNavigation } from "@/components/shared/GamesNavigation";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

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
  onResetData,
  onOpenAchievements,
}: GameMenuSheetProps) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session);
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsLoggedIn(!!session);
    });
    
    return () => subscription.unsubscribe();
  }, []);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="left" 
        className="w-80 overflow-y-auto"
        style={{
          background: 'hsl(var(--chain-card-bg))',
          borderColor: 'hsl(var(--chain-card-border))',
        }}
      >
        <SheetHeader>
          <SheetTitle 
            className="font-serif"
            style={{ color: 'hsl(var(--chain-text-primary))' }}
          >
            Menu
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-5 py-4">
          {/* Games Section */}
          <GamesNavigation currentGame="chain" onNavigate={() => onOpenChange(false)} />

          <Separator style={{ background: 'hsl(var(--chain-divider))' }} />

          {/* Account Section */}
          <div>
            <h3 
              className="text-xs font-semibold uppercase tracking-wider mb-3 px-2"
              style={{ color: 'hsl(var(--chain-text-muted))' }}
            >
              Account
            </h3>
            <div className="space-y-1">
              <button
                onClick={() => {
                  navigate(isLoggedIn ? '/profile' : '/login');
                  onOpenChange(false);
                }}
                className="w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-2"
                style={{ color: 'hsl(var(--chain-text-primary))' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'hsl(var(--chain-divider))'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <User className="w-4 h-4" style={{ color: 'hsl(var(--chain-accent))' }} />
                <span className="text-sm">{isLoggedIn ? 'My Account' : 'Sign In'}</span>
              </button>
            </div>
          </div>

          <Separator style={{ background: 'hsl(var(--chain-divider))' }} />

          {/* Chain-specific: Achievements */}
          <div>
            <h3 
              className="text-xs font-semibold uppercase tracking-wider mb-3 px-2"
              style={{ color: 'hsl(var(--chain-text-muted))' }}
            >
              Morph Chain
            </h3>
            <div className="space-y-1">
              {onOpenAchievements && (
                <button
                  onClick={() => {
                    onOpenAchievements();
                    onOpenChange(false);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-2"
                  style={{ color: 'hsl(var(--chain-text-primary))' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'hsl(var(--chain-divider))'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <Trophy className="w-4 h-4" style={{ color: 'hsl(var(--chain-accent))' }} />
                  <span className="text-sm">Achievements</span>
                </button>
              )}
            </div>
          </div>

          <Separator style={{ background: 'hsl(var(--chain-divider))' }} />

          {/* Settings Section - Collapsible */}
          <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
            <CollapsibleTrigger 
              className="flex items-center justify-between w-full px-2 py-1.5 rounded-lg transition-colors"
              style={{ color: 'hsl(var(--chain-text-primary))' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'hsl(var(--chain-divider))'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" style={{ color: 'hsl(var(--chain-text-muted))' }} />
                <span className="font-medium text-sm">Settings</span>
              </div>
              <ChevronDown 
                className={`h-4 w-4 transition-transform ${settingsOpen ? 'rotate-180' : ''}`} 
                style={{ color: 'hsl(var(--chain-text-muted))' }}
              />
            </CollapsibleTrigger>
            
            <CollapsibleContent className="space-y-4 pt-4">
              <div className="flex items-center justify-between px-2">
                <div className="space-y-0.5">
                  <Label 
                    htmlFor="hard-mode" 
                    className="text-sm"
                    style={{ color: 'hsl(var(--chain-text-primary))' }}
                  >
                    Hard Mode
                  </Label>
                  <p 
                    className="text-xs"
                    style={{ color: 'hsl(var(--chain-text-muted))' }}
                  >
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
                  <Label 
                    htmlFor="colorblind-mode" 
                    className="text-sm"
                    style={{ color: 'hsl(var(--chain-text-primary))' }}
                  >
                    Colorblind Mode
                  </Label>
                  <p 
                    className="text-xs"
                    style={{ color: 'hsl(var(--chain-text-muted))' }}
                  >
                    Use shapes for hints
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
                  <Label 
                    htmlFor="vibration" 
                    className="text-sm"
                    style={{ color: 'hsl(var(--chain-text-primary))' }}
                  >
                    Vibration
                  </Label>
                  <p 
                    className="text-xs"
                    style={{ color: 'hsl(var(--chain-text-muted))' }}
                  >
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
                  <Label 
                    htmlFor="onscreen-keyboard" 
                    className="text-sm"
                    style={{ color: 'hsl(var(--chain-text-primary))' }}
                  >
                    On-Screen Keyboard
                  </Label>
                  <p 
                    className="text-xs"
                    style={{ color: 'hsl(var(--chain-text-muted))' }}
                  >
                    Show keyboard overlay
                  </p>
                </div>
                <Switch
                  id="onscreen-keyboard"
                  checked={useOnScreenKeyboard}
                  onCheckedChange={onToggleOnScreenKeyboard}
                />
              </div>

              <Separator style={{ background: 'hsl(var(--chain-divider))' }} />

              <div className="flex flex-col gap-2 px-2">
                <Label 
                  className="text-sm"
                  style={{ color: 'hsl(var(--chain-text-primary))' }}
                >
                  Install App
                </Label>
                <AddToHomeScreen />
                <p 
                  className="text-xs"
                  style={{ color: 'hsl(var(--chain-text-muted))' }}
                >
                  Add to home screen
                </p>
              </div>

              <Separator style={{ background: 'hsl(var(--chain-divider))' }} />

              <div className="space-y-2 px-2">
                <Label 
                  className="text-sm"
                  style={{ color: 'hsl(var(--chain-error))' }}
                >
                  Danger Zone
                </Label>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={onResetData}
                >
                  Reset Local Data
                </Button>
                <p 
                  className="text-xs"
                  style={{ color: 'hsl(var(--chain-text-muted))' }}
                >
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
