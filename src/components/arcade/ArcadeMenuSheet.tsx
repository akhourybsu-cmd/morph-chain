import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Award, Trophy } from "lucide-react";
import { useState } from "react";
import { GamesNavigation } from "@/components/shared/GamesNavigation";
import { AchievementGallery } from "@/components/chain/AchievementGallery";
import { ArcadeLeaderboard } from "./ArcadeLeaderboard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ArcadeMenuSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ArcadeMenuSheet = ({
  open,
  onOpenChange,
}: ArcadeMenuSheetProps) => {
  const [showAchievements, setShowAchievements] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="left" className="w-[280px] sm:w-[320px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>

          <div className="space-y-6 py-4">
            {/* Games Section */}
            <GamesNavigation currentGame="arcade" onNavigate={() => onOpenChange(false)} />

            <Separator />

            {/* Arcade-specific section */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-2">MORPH ARCADE</h3>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setShowAchievements(true);
                    onOpenChange(false);
                  }}
                  className="w-full text-left px-3 py-3 rounded-lg hover:bg-muted transition-colors flex items-center gap-2"
                >
                  <Award className="w-4 h-4 text-chain" />
                  Achievements
                </button>
                <button
                  onClick={() => {
                    setShowLeaderboard(true);
                    onOpenChange(false);
                  }}
                  className="w-full text-left px-3 py-3 rounded-lg hover:bg-muted transition-colors flex items-center gap-2"
                >
                  <Trophy className="w-4 h-4" />
                  Leaderboard
                </button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Achievements Modal */}
      <AchievementGallery 
        open={showAchievements} 
        onOpenChange={setShowAchievements} 
      />

      {/* Leaderboard Dialog */}
      <Dialog open={showLeaderboard} onOpenChange={setShowLeaderboard}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Arcade Leaderboard</DialogTitle>
          </DialogHeader>
          <ArcadeLeaderboard />
        </DialogContent>
      </Dialog>
    </>
  );
};
