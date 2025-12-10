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
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-9 w-9 sm:h-10 sm:w-10 text-[hsl(var(--grid-text-secondary))] hover:text-[hsl(var(--grid-text-primary))] hover:bg-[hsl(var(--grid-pill-bg))]"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent 
        side="left" 
        className="w-80 overflow-y-auto bg-white border-[hsl(var(--grid-card-border))]"
      >
        <div className="flex flex-col gap-6 mt-8 font-inter">
          {/* Games Section */}
          <GamesNavigation currentGame="grid" onNavigate={() => setOpen(false)} />

          <Separator className="bg-[hsl(var(--grid-divider))]" />

          {/* Grid-specific section */}
          <div>
            <h3 className="text-xs font-semibold text-[hsl(var(--grid-text-muted))] mb-3 px-2 uppercase tracking-wider">Morph Grid</h3>
            <div className="space-y-1">
              <button
                onClick={() => {
                  setShowAchievements(true);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-[hsl(var(--grid-pill-bg))] transition-colors flex items-center gap-2 text-[hsl(var(--grid-text-primary))]"
              >
                <Award className="w-4 h-4 text-[hsl(var(--grid-accent))]" />
                Achievements
              </button>
              <button
                onClick={() => {
                  setShowLeaderboard(true);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-[hsl(var(--grid-pill-bg))] transition-colors flex items-center gap-2 text-[hsl(var(--grid-text-primary))]"
              >
                <Trophy className="w-4 h-4 text-[hsl(var(--grid-accent))]" />
                Leaderboard
              </button>
              <button
                onClick={() => {
                  setShowStats(true);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-[hsl(var(--grid-pill-bg))] transition-colors flex items-center gap-2 text-[hsl(var(--grid-text-primary))]"
              >
                <BarChart3 className="w-4 h-4 text-[hsl(var(--grid-accent))]" />
                Stats
              </button>
              <button
                onClick={() => {
                  setShowSettings(true);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-[hsl(var(--grid-pill-bg))] transition-colors flex items-center gap-2 text-[hsl(var(--grid-text-primary))]"
              >
                <Settings className="w-4 h-4 text-[hsl(var(--grid-accent))]" />
                Settings
              </button>
            </div>
          </div>

          <Separator className="bg-[hsl(var(--grid-divider))]" />

          {/* Info Section */}
          <div>
            <h3 className="text-xs font-semibold text-[hsl(var(--grid-text-muted))] mb-3 px-2 uppercase tracking-wider">Info</h3>
            <div className="space-y-1">
              <button
                onClick={() => {
                  navigate("/rules");
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-[hsl(var(--grid-pill-bg))] transition-colors flex items-center gap-2 text-[hsl(var(--grid-text-primary))]"
              >
                <HelpCircle className="w-4 h-4 text-[hsl(var(--grid-accent))]" />
                Rules
              </button>
              <button
                onClick={() => {
                  navigate("/whats-new");
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-[hsl(var(--grid-pill-bg))] transition-colors flex items-center gap-2 text-[hsl(var(--grid-text-primary))]"
              >
                <Sparkles className="w-4 h-4 text-[hsl(var(--grid-accent))]" />
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
        <DialogContent 
          className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white border-[hsl(var(--grid-card-border))]"
          style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
        >
          <DialogHeader>
            <DialogTitle className="font-playfair text-xl text-[hsl(var(--grid-text-primary))]">Leaderboard</DialogTitle>
          </DialogHeader>
          <GridLeaderboard dateSeed={dailySeed} />
        </DialogContent>
      </Dialog>

      {/* Stats Modal */}
      <GridStatsModal open={showStats} onOpenChange={setShowStats} />
      
      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent 
          className="sm:max-w-md bg-white border-[hsl(var(--grid-card-border))]"
          style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
        >
          <DialogHeader>
            <DialogTitle className="font-playfair text-xl text-[hsl(var(--grid-text-primary))]">Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4 font-inter">
            <div className="flex items-center justify-between">
              <Label htmlFor="animations" className="cursor-pointer">
                <div className="font-medium text-[hsl(var(--grid-text-primary))]">Animations</div>
                <div className="text-sm text-[hsl(var(--grid-text-muted))]">Enable tile animations</div>
              </Label>
              <Switch
                id="animations"
                checked={settings.animations}
                onCheckedChange={(checked) => updateSetting('animations', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="sound-effects" className="cursor-pointer">
                <div className="font-medium text-[hsl(var(--grid-text-primary))]">Sound Effects</div>
                <div className="text-sm text-[hsl(var(--grid-text-muted))]">Audio feedback for actions</div>
              </Label>
              <Switch
                id="sound-effects"
                checked={settings.soundEnabled}
                onCheckedChange={(checked) => updateSetting('soundEnabled', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="sound-haptics" className="cursor-pointer">
                <div className="font-medium text-[hsl(var(--grid-text-primary))]">Haptics</div>
                <div className="text-sm text-[hsl(var(--grid-text-muted))]">Vibration feedback</div>
              </Label>
              <Switch
                id="sound-haptics"
                checked={settings.soundHaptics}
                onCheckedChange={(checked) => updateSetting('soundHaptics', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="colorblind" className="cursor-pointer">
                <div className="font-medium text-[hsl(var(--grid-text-primary))]">Colorblind Mode</div>
                <div className="text-sm text-[hsl(var(--grid-text-muted))]">Alternative color palette</div>
              </Label>
              <Switch
                id="colorblind"
                checked={settings.colorblindMode}
                onCheckedChange={(checked) => updateSetting('colorblindMode', checked)}
              />
            </div>
            
            <div className="pt-4 border-t border-[hsl(var(--grid-divider))]">
              <div className="text-sm text-[hsl(var(--grid-text-muted))] space-y-2">
                <p className="font-medium text-[hsl(var(--grid-text-secondary))]">About Morph Grid</p>
                <p>Turn all 25 tiles to Tier 3 in the fewest moves by forming words. Each grid is balanced for fair play.</p>
                <p className="text-xs mt-3">To manage game data and settings across all games, visit your Profile page.</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
};
