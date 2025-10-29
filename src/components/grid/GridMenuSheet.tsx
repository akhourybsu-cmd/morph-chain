import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Menu, Trophy, BarChart3, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MorphChainTitle, MorphRushTitle, MorphGridTitle, MorphPrismTitle } from "@/components/GameTitles";
import { useState } from "react";
import { GridLeaderboard } from "./GridLeaderboard";
import { GridStatsModal } from "./GridStats";
import { useGridStore } from "@/stores/gridStore";
import { useGridSettings } from "@/hooks/useGridSettings";

export const GridMenuSheet = () => {
  const navigate = useNavigate();
  const { dailySeed } = useGridStore();
  const { settings, updateSetting } = useGridSettings();
  const [open, setOpen] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const games = [
    { title: <MorphChainTitle className="text-sm" />, path: "/", description: "Word ladder" },
    { title: <MorphGridTitle className="text-sm" />, path: "/grid", description: "Daily 5×5 puzzle", active: true },
    { title: <MorphRushTitle className="text-sm" />, path: "/rush?mode=daily", description: "Score dash" },
    { title: <MorphPrismTitle className="text-sm" />, path: "/prism", description: "Coming soon", disabled: true },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10">
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80">
        <div className="flex flex-col gap-6 mt-8">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-2">GAMES</h3>
            <div className="space-y-1">
              {games.map((game) => (
                <button
                  key={game.path}
                  onClick={() => {
                    if (!game.disabled) {
                      navigate(game.path);
                      setOpen(false);
                    }
                  }}
                  disabled={game.disabled}
                  className={`w-full text-left px-3 py-3 rounded-lg transition-colors ${
                    game.active 
                      ? "bg-primary/10 border border-primary/20" 
                      : game.disabled
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-muted"
                  }`}
                >
                  <div className="flex flex-col gap-0.5">
                    {game.title}
                    <span className="text-xs text-muted-foreground">{game.description}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-2">STATS & INFO</h3>
            <div className="space-y-1">
              <button
                onClick={() => {
                  setShowLeaderboard(true);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-3 rounded-lg hover:bg-muted transition-colors flex items-center gap-2"
              >
                <Trophy className="w-4 h-4" />
                Leaderboard
              </button>
              <button
                onClick={() => {
                  setShowStats(true);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-3 rounded-lg hover:bg-muted transition-colors flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                Stats
              </button>
              <button
                onClick={() => {
                  setShowSettings(true);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-3 rounded-lg hover:bg-muted transition-colors flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
              <button
                onClick={() => {
                  navigate("/rules");
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-3 rounded-lg hover:bg-muted transition-colors"
              >
                Rules
              </button>
              <button
                onClick={() => {
                  navigate("/whats-new");
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-3 rounded-lg hover:bg-muted transition-colors"
              >
                What's New
              </button>
            </div>
          </div>
        </div>
      </SheetContent>

      {/* Leaderboard Dialog */}
      <Dialog open={showLeaderboard} onOpenChange={setShowLeaderboard}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Leaderboard</DialogTitle>
          </DialogHeader>
          <GridLeaderboard dateSeed={dailySeed} />
        </DialogContent>
      </Dialog>

      {/* Stats Modal */}
      <GridStatsModal open={showStats} onOpenChange={setShowStats} />
      
      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="animations" className="cursor-pointer">
                <div className="font-medium">Animations</div>
                <div className="text-sm text-muted-foreground">Enable tile animations</div>
              </Label>
              <Switch
                id="animations"
                checked={settings.animations}
                onCheckedChange={(checked) => updateSetting('animations', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="sound-haptics" className="cursor-pointer">
                <div className="font-medium">Sound & Haptics</div>
                <div className="text-sm text-muted-foreground">Vibration feedback</div>
              </Label>
              <Switch
                id="sound-haptics"
                checked={settings.soundHaptics}
                onCheckedChange={(checked) => updateSetting('soundHaptics', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="colorblind" className="cursor-pointer">
                <div className="font-medium">Colorblind Mode</div>
                <div className="text-sm text-muted-foreground">Alternative color palette</div>
              </Label>
              <Switch
                id="colorblind"
                checked={settings.colorblindMode}
                onCheckedChange={(checked) => updateSetting('colorblindMode', checked)}
              />
            </div>
            
            <div className="pt-4 border-t">
              <div className="text-sm text-muted-foreground space-y-2">
                <p className="font-medium">About Morph Grid</p>
                <p>Turn all 25 tiles Purple in the fewest moves by forming words. Today's board uses a balanced letter generator so every grid is fair and word-friendly. During play, morphs subtly keep vowels and consonants in a healthy mix.</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
};
