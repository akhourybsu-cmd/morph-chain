import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CHAIN_ACHIEVEMENTS, getChainAchievements } from "@/lib/chainAchievements";
import { ACHIEVEMENTS as RUSH_ACHIEVEMENTS, getUnlockedAchievements as getRushAchievements } from "@/lib/rushAchievements";
import { GRID_ACHIEVEMENTS, getGridAchievements } from "@/lib/gridAchievements";
import { Lock, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface AchievementGalleryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface GameSectionProps {
  title: string;
  icon: string;
  achievements: Record<string, { id: string; title: string; description: string; icon: string; flavorText: string }>;
  unlockedIds: string[];
  accentColor: string;
  defaultOpen?: boolean;
}

const GameSection = ({ title, icon, achievements, unlockedIds, accentColor, defaultOpen = false }: GameSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const achievementsList = Object.values(achievements);
  const unlockedCount = achievementsList.filter(a => unlockedIds.includes(a.id)).length;
  const totalCount = achievementsList.length;
  const progressPercent = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  return (
    <div className="border border-[hsl(var(--home-card-border))] rounded-lg overflow-hidden bg-[hsl(var(--home-card-bg))]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between p-4 transition-colors",
          "hover:bg-[hsl(var(--home-pill-bg))]"
        )}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <div className="text-left">
            <h3 className="font-semibold text-[hsl(var(--home-text-primary))]">{title}</h3>
            <div className="flex items-center gap-2 text-sm text-[hsl(var(--home-text-muted))]">
              <span>{unlockedCount} / {totalCount}</span>
              <div className="w-20 h-1.5 bg-[hsl(var(--home-pill-bg))] rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-300"
                  style={{ 
                    width: `${progressPercent}%`,
                    backgroundColor: accentColor 
                  }}
                />
              </div>
              <span className="text-xs">{progressPercent}%</span>
            </div>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-[hsl(var(--home-text-muted))]" />
        ) : (
          <ChevronDown className="h-5 w-5 text-[hsl(var(--home-text-muted))]" />
        )}
      </button>
      
      {isOpen && (
        <div className="p-4 pt-0 grid gap-2">
          {achievementsList.map((achievement) => {
            const isUnlocked = unlockedIds.includes(achievement.id);
            
            return (
              <div
                key={achievement.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border transition-all",
                  isUnlocked 
                    ? "bg-[hsl(var(--home-card-bg))] border-[hsl(var(--home-card-border))]" 
                    : "bg-[hsl(var(--home-pill-bg))] border-[hsl(var(--home-card-border))]/50 opacity-60"
                )}
              >
                <div 
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0",
                    isUnlocked 
                      ? "bg-[hsl(var(--home-pill-bg))]" 
                      : "bg-[hsl(var(--home-pill-bg))]"
                  )}
                  style={isUnlocked ? { backgroundColor: `${accentColor}20` } : {}}
                >
                  {isUnlocked ? (
                    achievement.icon
                  ) : (
                    <Lock className="h-4 w-4 text-[hsl(var(--home-text-muted))]" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className={cn(
                    "font-medium text-sm",
                    isUnlocked ? "text-[hsl(var(--home-text-primary))]" : "text-[hsl(var(--home-text-muted))]"
                  )}>
                    {achievement.title}
                  </h4>
                  <p className="text-xs text-[hsl(var(--home-text-muted))] line-clamp-1">
                    {isUnlocked ? achievement.description : "???"}
                  </p>
                </div>

                {isUnlocked && (
                  <div className="shrink-0">
                    <span style={{ color: accentColor }} className="text-xs font-medium">✓</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const AchievementGallery = ({ open, onOpenChange }: AchievementGalleryProps) => {
  const chainUnlocked = getChainAchievements();
  const rushUnlocked = getRushAchievements();
  const gridUnlocked = getGridAchievements();

  const totalUnlocked = chainUnlocked.length + rushUnlocked.length + gridUnlocked.length;
  const totalAchievements = 
    Object.keys(CHAIN_ACHIEVEMENTS).length + 
    Object.keys(RUSH_ACHIEVEMENTS).length + 
    Object.keys(GRID_ACHIEVEMENTS).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-lg max-h-[85vh] overflow-y-auto bg-[hsl(var(--home-card-bg))] border-[hsl(var(--home-card-border))]"
        style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between font-playfair text-xl text-[hsl(var(--home-text-primary))]">
            <span className="flex items-center gap-2">
              <span className="text-2xl">🏆</span>
              Achievements
            </span>
            <span className="text-sm font-normal text-[hsl(var(--home-text-muted))]">
              {totalUnlocked} / {totalAchievements} total
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-3 mt-2">
          <GameSection
            title="Morph Chain"
            icon="🔗"
            achievements={CHAIN_ACHIEVEMENTS}
            unlockedIds={chainUnlocked}
            accentColor="#22c55e"
            defaultOpen={true}
          />
          
          <GameSection
            title="Morph Rush"
            icon="⚡"
            achievements={RUSH_ACHIEVEMENTS}
            unlockedIds={rushUnlocked}
            accentColor="#a855f7"
          />
          
          <GameSection
            title="Morph Grid"
            icon="🔲"
            achievements={GRID_ACHIEVEMENTS}
            unlockedIds={gridUnlocked}
            accentColor="#3b82f6"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
