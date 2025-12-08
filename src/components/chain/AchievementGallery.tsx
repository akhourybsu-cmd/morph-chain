import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CHAIN_ACHIEVEMENTS, getChainAchievements, Achievement } from "@/lib/chainAchievements";
import { Lock } from "lucide-react";

interface AchievementGalleryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AchievementGallery = ({ open, onOpenChange }: AchievementGalleryProps) => {
  const unlockedAchievements = getChainAchievements();
  const achievementsList = Object.values(CHAIN_ACHIEVEMENTS);
  const unlockedCount = unlockedAchievements.length;
  const totalCount = achievementsList.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Achievements</span>
            <span className="text-sm font-normal text-muted-foreground">
              {unlockedCount} / {totalCount}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-3 mt-4">
          {achievementsList.map((achievement) => {
            const isUnlocked = unlockedAchievements.includes(achievement.id);
            
            return (
              <div
                key={achievement.id}
                className={`
                  flex items-center gap-3 p-3 rounded-lg border transition-all
                  ${isUnlocked 
                    ? "bg-card border-chain/30" 
                    : "bg-muted/20 border-border opacity-60"
                  }
                `}
              >
                <div 
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center text-2xl
                    ${isUnlocked 
                      ? "bg-chain/20" 
                      : "bg-muted/40"
                    }
                  `}
                >
                  {isUnlocked ? (
                    achievement.icon
                  ) : (
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold text-sm ${isUnlocked ? "text-foreground" : "text-muted-foreground"}`}>
                    {achievement.title}
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">
                    {isUnlocked ? achievement.description : "???"}
                  </p>
                </div>

                {isUnlocked && (
                  <div className="flex-shrink-0">
                    <span className="text-chain text-xs font-medium">✓</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};
