import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Settings } from "lucide-react";
import { useState } from "react";
import { GamesNavigation } from "@/components/shared/GamesNavigation";
import { Button } from "@/components/ui/button";

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
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[280px] sm:w-[320px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 py-4">
          {/* Games Section */}
          <GamesNavigation currentGame="rush" onNavigate={() => onOpenChange(false)} />

          <Separator />

          {/* Rush-specific section */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-2">MORPH RUSH</h3>
            <div className="space-y-1">
              <button
                onClick={() => {
                  onOpenSettings();
                  onOpenChange(false);
                }}
                className="w-full text-left px-3 py-3 rounded-lg hover:bg-muted transition-colors flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Settings & Leaderboard
              </button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
