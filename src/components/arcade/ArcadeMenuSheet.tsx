import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Home, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { MorphChainTitle, MorphPrismTitle, MorphRushTitle, MorphGridTitle, MorphArcadeTitle } from "@/components/GameTitles";
import { useUserRole } from "@/hooks/useUserRole";

interface ArcadeMenuSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ArcadeMenuSheet = ({
  open,
  onOpenChange,
}: ArcadeMenuSheetProps) => {
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { hasBetaAccess } = useUserRole();

  const handleNavigate = (path: string) => {
    navigate(path);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[280px] sm:w-[320px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 py-4">
          {/* Morph Games Section */}
          <div className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start px-2 py-1 h-auto"
              onClick={() => handleNavigate("/")}
            >
              <Home className="h-4 w-4 mr-2 text-primary" />
              <h3 className="font-semibold text-sm">Morph Games</h3>
            </Button>

            <div className="pl-4 space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start text-sm h-auto py-2"
                onClick={() => handleNavigate("/")}
              >
                <MorphChainTitle className="text-base" />
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start text-sm h-auto py-2 gap-2"
                onClick={() => handleNavigate("/grid")}
              >
                <MorphGridTitle className="text-base" />
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start text-sm h-auto py-2"
                onClick={() => handleNavigate("/rush?mode=daily")}
              >
                <MorphRushTitle className="text-base" />
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start text-sm h-auto py-2 gap-2"
                onClick={() => hasBetaAccess && handleNavigate("/prism")}
                disabled={!hasBetaAccess}
              >
                <MorphPrismTitle className="text-base" />
                {!hasBetaAccess && (
                  <>
                    <Lock className="h-3 w-3 ml-auto" />
                    <span className="text-xs text-muted-foreground">Coming Soon</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Settings Section - Collapsible (minimal for now) */}
          <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-1 hover:bg-muted/50 rounded-md">
              <h3 className="font-semibold text-sm">Settings</h3>
              <ChevronDown className={`h-4 w-4 transition-transform ${settingsOpen ? 'rotate-180' : ''}`} />
            </CollapsibleTrigger>
            
            <CollapsibleContent className="space-y-4 pt-4 px-2">
              <p className="text-xs text-muted-foreground">
                Settings coming soon
              </p>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </SheetContent>
    </Sheet>
  );
};
