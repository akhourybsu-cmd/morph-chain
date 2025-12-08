import { useNavigate } from "react-router-dom";
import { MorphChainTitle, MorphRushTitle, MorphGridTitle } from "@/components/GameTitles";

interface GamesNavigationProps {
  currentGame: 'chain' | 'grid' | 'rush' | 'arcade';
  onNavigate?: () => void;
}

const games = [
  { id: 'chain', title: MorphChainTitle, path: "/", description: "Word ladder puzzle" },
  { id: 'grid', title: MorphGridTitle, path: "/grid", description: "Daily 5×5 puzzle" },
  { id: 'rush', title: MorphRushTitle, path: "/rush?mode=daily", description: "Timed score dash" },
];

export const GamesNavigation = ({ currentGame, onNavigate }: GamesNavigationProps) => {
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-2">GAMES</h3>
      <div className="space-y-1">
        {games.map((game) => {
          const TitleComponent = game.title;
          const isActive = game.id === currentGame;
          
          return (
            <button
              key={game.id}
              onClick={() => handleNavigate(game.path)}
              className={`w-full text-left px-3 py-3 rounded-lg transition-colors ${
                isActive 
                  ? "bg-primary/10 border border-primary/20" 
                  : "hover:bg-muted"
              }`}
            >
              <div className="flex flex-col gap-0.5">
                <TitleComponent className="text-sm" />
                <span className="text-xs text-muted-foreground">{game.description}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
