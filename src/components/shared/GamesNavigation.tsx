import { useNavigate } from "react-router-dom";
import { Link2, Grid3X3, Zap, Search } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";

interface GamesNavigationProps {
  currentGame: 'chain' | 'grid' | 'rush' | 'arcade' | 'alibi';
  onNavigate?: () => void;
}

const games = [
  { id: 'chain', name: "Morph Chain", icon: Link2, path: "/chain", description: "Word ladder puzzle", adminOnly: false },
  { id: 'grid', name: "Morph Grid", icon: Grid3X3, path: "/grid", description: "Daily 5×5 puzzle", adminOnly: false },
  { id: 'rush', name: "Morph Rush", icon: Zap, path: "/rush?mode=daily", description: "Timed score dash", adminOnly: false },
  { id: 'alibi', name: "Morph Alibi", icon: Search, path: "/alibi", description: "Daily logic mystery", adminOnly: true },
];

export const GamesNavigation = ({ currentGame, onNavigate }: GamesNavigationProps) => {
  const navigate = useNavigate();
  const { role } = useUserRole();
  const isAdmin = role === 'admin';

  const handleNavigate = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  // Filter games based on admin status
  const visibleGames = games.filter(game => !game.adminOnly || isAdmin);

  return (
    <div>
      <h3 
        className="text-xs font-semibold uppercase tracking-wider mb-3 px-2"
        style={{ color: 'hsl(var(--grid-text-muted))' }}
      >
        Games
      </h3>
      <div className="space-y-1">
        {visibleGames.map((game) => {
          const Icon = game.icon;
          const isActive = game.id === currentGame;
          
          return (
            <button
              key={game.id}
              onClick={() => handleNavigate(game.path)}
              className="w-full text-left px-3 py-2.5 rounded-lg transition-colors"
              style={{ 
                background: isActive ? 'hsl(var(--grid-divider))' : 'transparent',
                color: 'hsl(var(--grid-text-primary))'
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = 'hsl(var(--grid-divider))';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = 'transparent';
              }}
            >
              <div className="flex items-center gap-3">
                <Icon 
                  className="w-4 h-4 flex-shrink-0" 
                  style={{ color: isActive ? 'hsl(var(--grid-accent))' : 'hsl(var(--grid-text-muted))' }}
                />
                <div className="flex flex-col">
                  <span className="text-sm font-medium flex items-center gap-2">
                    {game.name}
                    {game.adminOnly && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                        Admin
                      </span>
                    )}
                  </span>
                  <span 
                    className="text-xs"
                    style={{ color: 'hsl(var(--grid-text-muted))' }}
                  >
                    {game.description}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
