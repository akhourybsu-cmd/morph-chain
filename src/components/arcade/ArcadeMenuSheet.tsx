import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { GamesNavigation } from "@/components/shared/GamesNavigation";

interface ArcadeMenuSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ArcadeMenuSheet = ({
  open,
  onOpenChange,
}: ArcadeMenuSheetProps) => {
  return (
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
              <p className="text-xs text-muted-foreground px-3">
                More features coming soon
              </p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
