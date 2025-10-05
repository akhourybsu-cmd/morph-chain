import { Menu, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GameHeaderProps {
  onOpenSettings: () => void;
  onOpenStats: () => void;
}

export const GameHeader = ({ onOpenSettings, onOpenStats }: GameHeaderProps) => {
  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
      <Button
        variant="ghost"
        size="icon"
        onClick={onOpenSettings}
        aria-label="Open settings"
        className="hover:bg-muted/50"
      >
        <Menu className="h-5 w-5" />
      </Button>
      
      <h1 className="text-lg font-semibold tracking-tight">Morph Chain</h1>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={onOpenStats}
        aria-label="View statistics"
        className="hover:bg-muted/50"
      >
        <TrendingUp className="h-5 w-5" />
      </Button>
    </header>
  );
};
