import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { GamesNavigation } from "@/components/shared/GamesNavigation";

interface PrismMenuSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PrismMenuSheet = ({
  open,
  onOpenChange,
}: PrismMenuSheetProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[280px] sm:w-[320px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 py-4">
          {/* Games Section */}
          <GamesNavigation currentGame="chain" onNavigate={() => onOpenChange(false)} />

          <Separator />

          <div>
            <p className="text-xs text-muted-foreground px-3">
              Settings coming soon
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
