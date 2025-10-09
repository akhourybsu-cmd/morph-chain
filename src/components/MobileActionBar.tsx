import { Button } from "@/components/ui/button";
import { Send, Lightbulb, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileActionBarProps {
  onSubmit: () => void;
  onHint?: () => void;
  onUndo?: () => void;
  hintsRemaining?: number;
  canUndo?: boolean;
  disabled?: boolean;
  className?: string;
}

export const MobileActionBar = ({
  onSubmit,
  onHint,
  onUndo,
  hintsRemaining,
  canUndo,
  disabled,
  className,
}: MobileActionBarProps) => {
  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-t border-border px-4 py-3 flex gap-2 md:hidden",
        className
      )}
    >
      {onUndo && (
        <Button
          variant="outline"
          size="icon"
          onClick={onUndo}
          disabled={!canUndo || disabled}
          className="shrink-0"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
      )}
      
      {onHint && (
        <Button
          variant="outline"
          size="icon"
          onClick={onHint}
          disabled={!hintsRemaining || disabled}
          className="shrink-0 relative"
        >
          <Lightbulb className="h-4 w-4" />
          {hintsRemaining !== undefined && hintsRemaining > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
              {hintsRemaining}
            </span>
          )}
        </Button>
      )}
      
      <Button
        onClick={onSubmit}
        disabled={disabled}
        className="flex-1 gap-2"
      >
        <Send className="h-4 w-4" />
        Submit
      </Button>
    </div>
  );
};
