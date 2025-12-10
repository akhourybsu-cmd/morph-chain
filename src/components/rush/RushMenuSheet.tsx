import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Settings, Award } from "lucide-react";
import { useState } from "react";
import { GamesNavigation } from "@/components/shared/GamesNavigation";
import { AchievementGallery } from "@/components/chain/AchievementGallery";

interface RushMenuSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenSettings: () => void;
}

export const RushMenuSheet = ({
  open,
  onOpenChange,
  onOpenSettings,
}: RushMenuSheetProps) => {
  const [showAchievements, setShowAchievements] = useState(false);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent 
          side="left" 
          className="w-80 overflow-y-auto"
          style={{
            background: 'hsl(var(--rush-card-bg))',
            borderColor: 'hsl(var(--rush-card-border))',
          }}
        >
          <SheetHeader>
            <SheetTitle 
              className="font-serif"
              style={{ color: 'hsl(var(--rush-text-primary))' }}
            >
              Menu
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-5 py-4">
            {/* Games Section */}
            <GamesNavigation currentGame="rush" onNavigate={() => onOpenChange(false)} />

            <Separator style={{ background: 'hsl(var(--rush-divider))' }} />

            {/* Rush-specific section */}
            <div>
              <h3 
                className="text-xs font-semibold uppercase tracking-wider mb-3 px-2"
                style={{ color: 'hsl(var(--rush-text-muted))' }}
              >
                Morph Rush
              </h3>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setShowAchievements(true);
                    onOpenChange(false);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-2"
                  style={{ color: 'hsl(var(--rush-text-primary))' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'hsl(var(--rush-divider))'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <Award className="w-4 h-4" style={{ color: 'hsl(var(--rush-accent))' }} />
                  <span className="text-sm">Achievements</span>
                </button>
                <button
                  onClick={() => {
                    onOpenSettings();
                    onOpenChange(false);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-2"
                  style={{ color: 'hsl(var(--rush-text-primary))' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'hsl(var(--rush-divider))'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <Settings className="w-4 h-4" style={{ color: 'hsl(var(--rush-text-muted))' }} />
                  <span className="text-sm">Settings & Leaderboard</span>
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
    </>
  );
};
