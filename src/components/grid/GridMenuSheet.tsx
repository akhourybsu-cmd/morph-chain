import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MorphChainTitle, MorphRushTitle, MorphGridTitle } from "@/components/GameTitles";
import { useState } from "react";

export const GridMenuSheet = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const games = [
    { title: <MorphChainTitle className="text-sm" />, path: "/chain", description: "Word ladder" },
    { title: <MorphRushTitle className="text-sm" />, path: "/rush?mode=daily", description: "Score dash" },
    { title: <MorphGridTitle className="text-sm" />, path: "/grid", description: "Daily 5×5 puzzle", active: true },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10">
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80">
        <div className="flex flex-col gap-6 mt-8">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-2">GAMES</h3>
            <div className="space-y-1">
              {games.map((game) => (
                <button
                  key={game.path}
                  onClick={() => {
                    navigate(game.path);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-3 py-3 rounded-lg transition-colors ${
                    game.active ? "bg-primary/10 border border-primary/20" : "hover:bg-muted"
                  }`}
                >
                  <div className="flex flex-col gap-0.5">
                    {game.title}
                    <span className="text-xs text-muted-foreground">{game.description}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-2">INFO</h3>
            <div className="space-y-1">
              <button
                onClick={() => {
                  navigate("/rules");
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-3 rounded-lg hover:bg-muted transition-colors"
              >
                Rules
              </button>
              <button
                onClick={() => {
                  navigate("/whats-new");
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-3 rounded-lg hover:bg-muted transition-colors"
              >
                What's New
              </button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
