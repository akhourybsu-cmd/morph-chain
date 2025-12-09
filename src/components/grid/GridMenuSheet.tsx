import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Menu, Trophy, BarChart3, Settings, HelpCircle, Sparkles, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { GridLeaderboard } from "./GridLeaderboard";
import { GridStatsModal } from "./GridStats";
import { useGridStore } from "@/stores/gridStore";
import { useGridSettings } from "@/hooks/useGridSettings";
import { GamesNavigation } from "@/components/shared/GamesNavigation";
import { AchievementGallery } from "@/components/chain/AchievementGallery";

export const GridMenuSheet = () => {
  const navigate = useNavigate();
  const { dailySeed } = useGridStore();
  const { settings, updateSetting } = useGridSettings();
  const [open, setOpen] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10">
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 overflow-y-auto">
        <div className="flex flex-col gap-6 mt-8">
          {/* Games Section */}
          <GamesNavigation currentGame="grid" onNavigate={() => setOpen(false)} />

          <Separator />

          {/* Grid-specific section */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-2">MORPH GRID</h3>
            <div className="space-y-1">
              <button
                onClick={() => {
                  setShowAchievements(true);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-3 rounded-lg hover:bg-muted transition-colors flex items-center gap-2"
              >
                <Award className="w-4 h-4 text-grid" />
                Achievements
              </button>
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
            </div>
          </div>

          <Separator />

          {/* Info Section */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-2">INFO</h3>
            <div className="space-y-1">
              <button
                onClick={() => {
                  navigate("/rules");
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-3 rounded-lg hover:bg-muted transition-colors flex items-center gap-2"
              >
                <HelpCircle className="w-4 h-4" />
                Rules
              </button>
              <button
                onClick={() => {
                  navigate("/whats-new");
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-3 rounded-lg hover:bg-muted transition-colors flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                What's New
              </button>
            </div>
          </div>
        </div>
      </SheetContent>

      {/* Achievements Modal */}
      <AchievementGallery 
        open={showAchievements} 
        onOpenChange={setShowAchievements} 
      />

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
                <p className="text-xs mt-3">To manage game data and settings across all games, visit your Profile page.</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
};
