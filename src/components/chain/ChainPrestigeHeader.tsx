import { Menu, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChainPrestigeHeaderProps {
  puzzleNumber: number;
  date: string;
  onOpenMenu: () => void;
  onOpenHelp: () => void;
}

export const ChainPrestigeHeader = ({
  puzzleNumber,
  date,
  onOpenMenu,
  onOpenHelp,
}: ChainPrestigeHeaderProps) => {
  // Format date as "Wed, Dec 10"
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <header className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4">
      {/* Left: Menu */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onOpenMenu}
        className="h-8 w-8 text-[hsl(var(--chain-text-secondary))] hover:text-[hsl(var(--chain-text-primary))] hover:bg-transparent"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Center: Title and date */}
      <div className="text-center">
        <h1 className="font-serif text-lg md:text-xl font-semibold tracking-wide text-[hsl(var(--chain-text-primary))]">
          MORPH CHAIN
        </h1>
        <p className="text-xs text-[hsl(var(--chain-text-muted))]">
          Puzzle #{puzzleNumber} · {formatDate(date)}
        </p>
      </div>

      {/* Right: Help */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onOpenHelp}
        className="h-8 w-8 text-[hsl(var(--chain-text-secondary))] hover:text-[hsl(var(--chain-text-primary))] hover:bg-transparent"
      >
        <HelpCircle className="h-5 w-5" />
      </Button>
    </header>
  );
};
