import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDailyPuzzle } from "@/lib/gameLogic";
import { formatInTimeZone } from "date-fns-tz";
import { MorphHeader } from "@/components/MorphHeader";
import morphIcon from "@/assets/morph-icon.png";

const GameSelector = () => {
  const navigate = useNavigate();
  const puzzle = getDailyPuzzle(4);
  
  const timezone = "America/New_York";
  const formattedDate = formatInTimeZone(new Date(), timezone, 'MMMM d, yyyy');
  
  return (
    <div className="min-h-screen flex flex-col">
      <MorphHeader />
      
      <main className="flex-1 container mx-auto px-4 py-8 md:py-12 max-w-6xl">
        {/* Hero Section */}
        <section className="mb-12 md:mb-16">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <h1 className="font-outfit font-bold text-4xl md:text-5xl tracking-tight" style={{ letterSpacing: '-0.02em' }}>
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  MORPH GAMES
                </span>
              </h1>
              <p className="text-lg md:text-xl text-foreground">
                Daily, solvable "change-one-thing" puzzles.
              </p>
              <p className="text-sm md:text-base text-muted-foreground">
                Modern English only • NY-anchored daily • Spoiler-free shares
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                <span>{formattedDate}</span>
                <span>•</span>
                <span>Puzzle #{puzzle.puzzleIndex}</span>
              </div>
            </div>
            
            {/* Brand M Icon */}
            <div className="flex items-center justify-center md:justify-end">
              <img 
                src={morphIcon} 
                alt="Morph Games Icon" 
                className="w-32 h-32 md:w-48 md:h-48 object-contain"
              />
            </div>
          </div>
        </section>

        {/* Game Cards Grid */}
        <section className="grid md:grid-cols-3 gap-6">
          <GameCard
            title="Morph Chain"
            description="Change one letter each step to reach today's goal"
            mode="Word ladder"
            difficulty="Moderate"
            avgTime="3-5 min"
            accent="chain"
            motif="chain-links"
            onClick={() => navigate('/chain')}
          />
          
          <GameCard
            title="Morph Rush"
            description="Make as many 4-letter morphs as you can in 2 minutes"
            mode="Score dash"
            difficulty="Fast-paced"
            avgTime="2 min"
            accent="rush"
            motif="motion"
            onClick={() => navigate('/rush?mode=daily')}
            secondaryAction={{
              label: "Practice Mode",
              onClick: () => navigate('/rush?mode=practice')
            }}
          />
          
          <GameCard
            title="Morph Prism"
            description="Adjust hue, saturation, or lightness one step at a time"
            mode="Color ladder"
            difficulty="Challenging"
            avgTime="4-6 min"
            accent="prism"
            motif="spectrum"
            comingSoon={true}
            onClick={() => navigate('/prism')}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 mt-12">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>© 2025 Morph Games</span>
          <div className="flex gap-4">
            <button onClick={() => navigate('/rules')} className="hover:text-foreground transition-colors">
              Rules
            </button>
            <button onClick={() => navigate('/privacy')} className="hover:text-foreground transition-colors">
              Privacy
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

interface GameCardProps {
  title: string;
  description: string;
  mode: string;
  difficulty: string;
  avgTime: string;
  accent: 'chain' | 'prism' | 'rush';
  motif: 'chain-links' | 'spectrum' | 'motion';
  comingSoon?: boolean;
  onClick: () => void;
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

const GameCard = ({ 
  title, 
  description, 
  mode, 
  difficulty, 
  avgTime, 
  accent, 
  motif,
  comingSoon,
  onClick, 
  secondaryAction 
}: GameCardProps) => {
  const navigate = useNavigate();
  const accentClasses = {
    chain: "border-chain/30 hover:border-chain hover:shadow-lg hover:shadow-chain/20",
    prism: "border-primary/30 hover:border-primary hover:shadow-lg hover:shadow-primary/20",
    rush: "border-rush-start/30 hover:border-rush-start hover:shadow-lg hover:shadow-rush-start/20"
  };

  const motifPatterns = {
    'chain-links': (
      <div className="absolute top-0 right-0 w-32 h-32 opacity-5 overflow-hidden">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="20" cy="20" r="15" stroke="currentColor" strokeWidth="3" fill="none" />
          <circle cx="50" cy="20" r="15" stroke="currentColor" strokeWidth="3" fill="none" />
          <circle cx="35" cy="50" r="15" stroke="currentColor" strokeWidth="3" fill="none" />
        </svg>
      </div>
    ),
    'spectrum': (
      <div className="absolute inset-0 opacity-10">
        <div className="w-full h-full bg-gradient-prism" style={{ 
          background: 'linear-gradient(135deg, hsl(var(--prism-accent-start)), hsl(var(--prism-accent-mid)), hsl(var(--prism-accent-end)))'
        }} />
      </div>
    ),
    'motion': (
      <div className="absolute top-4 right-4 opacity-10">
        <svg width="80" height="40" viewBox="0 0 80 40">
          <line x1="0" y1="10" x2="60" y2="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <line x1="10" y1="20" x2="70" y2="20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          <line x1="5" y1="30" x2="65" y2="30" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      </div>
    )
  };

  return (
    <Card 
      className={`relative p-6 border-2 transition-all group overflow-hidden ${accentClasses[accent]} ${comingSoon ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`} 
      onClick={comingSoon ? undefined : onClick}
    >
      {comingSoon && (
        <div className="absolute top-4 right-4 z-20 px-3 py-1 bg-yellow-500/20 text-yellow-300 border border-yellow-500/50 rounded-md text-xs font-semibold">
          Coming Soon
        </div>
      )}
      {motifPatterns[motif]}
      
      <div className="relative z-10 space-y-4">
        <div className="space-y-2">
          {accent === 'chain' && (
            <h2 className="font-outfit font-bold text-2xl tracking-tight bg-gradient-to-r from-chain to-chain bg-clip-text text-transparent">
              MORPH CHAIN
            </h2>
          )}
          {accent === 'prism' && (
            <h2 className="font-outfit font-bold text-2xl tracking-tight bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 bg-clip-text text-transparent">
              MORPH PRISM
            </h2>
          )}
          {accent === 'rush' && (
            <h2 className="font-outfit font-bold text-2xl tracking-tight bg-gradient-rush bg-clip-text text-transparent" style={{ fontStyle: 'italic' }}>
              MORPH RUSH
            </h2>
          )}
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <span className="px-2 py-1 text-xs font-medium bg-muted rounded-md">
            {mode}
          </span>
          <span className="px-2 py-1 text-xs font-medium bg-muted rounded-md">
            {avgTime}
          </span>
          <span className="px-2 py-1 text-xs font-medium bg-muted rounded-md">
            {difficulty}
          </span>
        </div>

        <div className="flex gap-2 pt-2">
          <Button 
            className="flex-1"
            disabled={comingSoon}
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            Play Today
          </Button>
        </div>

        {secondaryAction && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            disabled={comingSoon}
            onClick={(e) => {
              e.stopPropagation();
              secondaryAction.onClick();
            }}
          >
            {secondaryAction.label}
          </Button>
        )}

        <button 
          className="text-xs text-muted-foreground hover:text-foreground transition-colors underline disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={comingSoon}
          onClick={(e) => {
            e.stopPropagation();
            navigate('/rules');
          }}
        >
          How to play
        </button>
      </div>
    </Card>
  );
};

export default GameSelector;
