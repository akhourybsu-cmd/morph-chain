import { Button } from "@/components/ui/button";
import { RefreshCw, ArrowLeftRight } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MorphPowerupsProps {
  doubleSwapUsed: boolean;
  letterSwapUsed: boolean;
  doubleSwapActive: boolean;
  letterSwapActive: boolean;
  onDoubleSwap: () => void;
  onLetterSwap: () => void;
  disabled: boolean;
}

export const MorphPowerups = ({
  doubleSwapUsed,
  letterSwapUsed,
  doubleSwapActive,
  letterSwapActive,
  onDoubleSwap,
  onLetterSwap,
  disabled
}: MorphPowerupsProps) => {
  // Only show Double Swap, hide Letter Swap
  return (
    <TooltipProvider>
      <div className="flex items-center justify-center gap-3 py-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={onDoubleSwap}
              disabled={doubleSwapUsed || disabled}
              className={`h-10 px-4 transition-all ${
                doubleSwapActive 
                  ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 shadow-lg" 
                  : ""
              }`}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${doubleSwapActive ? "animate-pulse" : ""}`} />
              <span className="text-sm font-medium">Double Swap</span>
              {!doubleSwapUsed && (
                <span className="ml-2 px-1.5 py-0.5 text-xs bg-primary/20 rounded-full">
                  x1
                </span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Change 2 letters in one move</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};
