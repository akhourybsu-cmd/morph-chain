import { RefreshCw } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MorphPowerupsProps {
  doubleSwapUsed: boolean;
  consecutiveSingleSwaps: number;
  doubleSwapReady: boolean;
  disabled: boolean;
}

export const MorphPowerups = ({
  doubleSwapUsed,
  consecutiveSingleSwaps,
  doubleSwapReady,
  disabled
}: MorphPowerupsProps) => {
  // Progress dots (3 needed to unlock)
  const progressDots = [0, 1, 2].map((i) => (
    <div
      key={i}
      className={`w-2 h-2 rounded-full transition-all duration-300 ${
        consecutiveSingleSwaps > i
          ? "bg-chain shadow-[0_0_6px_hsl(var(--chain-accent)/0.6)]"
          : "bg-muted-foreground/30"
      }`}
    />
  ));

  if (doubleSwapUsed) {
    return (
      <div className="flex items-center justify-center gap-2 py-2 text-muted-foreground">
        <RefreshCw className="h-4 w-4 opacity-50" />
        <span className="text-xs">Double Swap used</span>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex items-center justify-center gap-3 py-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                doubleSwapReady
                  ? "bg-chain/20 border-chain text-chain shadow-[0_0_12px_hsl(var(--chain-accent)/0.4)] animate-pulse"
                  : "bg-card/50 border-border/50 text-muted-foreground"
              }`}
            >
              <RefreshCw className={`h-4 w-4 ${doubleSwapReady ? "animate-spin" : ""}`} />
              <span className="text-sm font-medium">
                {doubleSwapReady ? "READY! Change 2 letters" : "Double Swap"}
              </span>
              {!doubleSwapReady && (
                <div className="flex items-center gap-1 ml-1">
                  {progressDots}
                </div>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">
              {doubleSwapReady
                ? "Your next move can change 2 letters!"
                : `Make ${3 - consecutiveSingleSwaps} more single-letter moves to unlock`}
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};
