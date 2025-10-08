import { Button } from "@/components/ui/button";
import { Lightbulb, Undo2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RushPowerupsProps {
  scoutUsed: boolean;
  undoUsed: boolean;
  onScout: () => void;
  onUndo: () => void;
  canUndo: boolean;
  disabled: boolean;
}

export const RushPowerups = ({
  scoutUsed,
  undoUsed,
  onScout,
  onUndo,
  canUndo,
  disabled
}: RushPowerupsProps) => {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={onScout}
              disabled={scoutUsed || disabled}
              className="h-8 px-2 md:h-9 md:px-3"
            >
              <Lightbulb className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1" />
              <span className="text-xs md:text-sm">Scout</span>
              {!scoutUsed && <span className="ml-1 text-[10px] md:text-xs text-muted-foreground">(1)</span>}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Reveal an unused neighbor word</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={onUndo}
              disabled={undoUsed || !canUndo || disabled}
              className="h-8 px-2 md:h-9 md:px-3"
            >
              <Undo2 className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1" />
              <span className="text-xs md:text-sm">Undo</span>
              {!undoUsed && <span className="ml-1 text-[10px] md:text-xs text-muted-foreground">(1)</span>}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Revert last word and its points</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};
