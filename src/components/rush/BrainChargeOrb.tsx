import { Zap } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface BrainChargeOrbProps {
  multiplier: number;
  isActive: boolean;
}

export const BrainChargeOrb = ({ multiplier, isActive }: BrainChargeOrbProps) => {
  const chargeLevel = Math.min((multiplier - 1) / 2, 1); // 0 to 1 based on 1.0x to 3.0x
  const isCharged = multiplier > 1.0;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-300 ${
            isCharged && isActive
              ? 'bg-rush-orange/20 scale-110'
              : 'bg-muted/30'
          }`}>
            {/* Glowing orb background */}
            <div className="relative w-8 h-8 flex items-center justify-center">
              {/* Outer glow */}
              {isCharged && (
                <div 
                  className="absolute inset-0 rounded-full animate-breathe"
                  style={{
                    background: `radial-gradient(circle, hsl(var(--rush-orange) / ${chargeLevel * 0.4}) 0%, transparent 70%)`,
                    transform: `scale(${1 + chargeLevel * 0.5})`
                  }}
                />
              )}
              
              {/* Inner orb */}
              <div 
                className="relative w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300"
                style={{
                  background: isCharged 
                    ? `radial-gradient(circle, hsl(var(--rush-orange)) 0%, hsl(var(--rush-orange) / 0.3) 100%)`
                    : 'hsl(var(--muted))',
                  boxShadow: isCharged 
                    ? `0 0 ${8 + chargeLevel * 12}px hsl(var(--rush-orange) / ${0.6 + chargeLevel * 0.4})`
                    : 'none'
                }}
              >
                {/* Energy fill */}
                <div 
                  className="absolute inset-1 rounded-full transition-all duration-300"
                  style={{
                    background: `linear-gradient(to top, hsl(var(--rush-orange)) 0%, transparent 100%)`,
                    clipPath: `inset(${100 - chargeLevel * 100}% 0 0 0)`
                  }}
                />
                
                <Zap 
                  className={`h-3.5 w-3.5 z-10 transition-all ${
                    isCharged ? 'text-white' : 'text-muted-foreground'
                  }`}
                />
              </div>
            </div>
            
            {/* Multiplier value */}
            <span className={`text-sm md:text-base font-semibold tabular-nums ${
              isCharged ? 'text-rush-orange' : 'text-muted-foreground'
            }`}>
              {multiplier.toFixed(1)}x
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">
            {isCharged 
              ? "Brain Charge Active! Maintain your chain to increase!"
              : "Submit words quickly to build your Brain Charge!"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
