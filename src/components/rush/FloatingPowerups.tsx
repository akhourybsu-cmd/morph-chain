import { Button } from "@/components/ui/button";
import { Lightbulb, Undo2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface FloatingPowerupsProps {
  scoutUsed: boolean;
  undoUsed: boolean;
  onScout: () => void;
  onUndo: () => void;
  canUndo: boolean;
  disabled: boolean;
}

export const FloatingPowerups = ({
  scoutUsed,
  undoUsed,
  onScout,
  onUndo,
  canUndo,
  disabled
}: FloatingPowerupsProps) => {
  return (
    <TooltipProvider>
      <div className="flex items-center justify-center gap-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={onScout}
              disabled={scoutUsed || disabled}
              className={`
                h-12 w-12 rounded-full transition-all
                ${!scoutUsed && !disabled 
                  ? 'hover:scale-110 hover:bg-rush-blue/20 hover:border-rush-blue' 
                  : ''
                }
                ${scoutUsed ? 'opacity-40' : ''}
              `}
            >
              <Lightbulb className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-center">
              <p className="text-xs font-semibold">Scout</p>
              <p className="text-[10px] text-muted-foreground">Reveal an unused neighbor</p>
            </div>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={onUndo}
              disabled={undoUsed || !canUndo || disabled}
              className={`
                h-12 w-12 rounded-full transition-all
                ${!undoUsed && canUndo && !disabled
                  ? 'hover:scale-110 hover:bg-rush-violet/20 hover:border-rush-violet' 
                  : ''
                }
                ${undoUsed || !canUndo ? 'opacity-40' : ''}
              `}
            >
              <Undo2 className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-center">
              <p className="text-xs font-semibold">Undo</p>
              <p className="text-[10px] text-muted-foreground">Revert last word</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};
