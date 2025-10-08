import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, Palette, Zap, Info, BarChart3, Settings } from "lucide-react";
import { Logo } from "@/components/Logo";
import { getRushDailyPuzzle } from "@/lib/rushLogic";
import { getDailyPuzzle } from "@/lib/gameLogic";
import { formatInTimeZone } from "date-fns-tz";

const GameSelector = () => {
  const navigate = useNavigate();
  const puzzle = getDailyPuzzle(4);
  const rushPuzzle = getRushDailyPuzzle();
  
  const timezone = "America/New_York";
  const formattedDate = formatInTimeZone(new Date(), timezone, 'MMMM d, yyyy');
  
  return (
    <div className="min-h-screen flex flex-col max-w-2xl mx-auto">
      <header className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 border-b border-border">
        <Logo />
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/admin')}
            className="h-8 w-8 md:h-9 md:w-9"
          >
            <BarChart3 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 md:h-9 md:w-9"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </header>
      
      <main className="flex-1 px-4 py-6 md:px-6 md:py-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold">Choose Your Game</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            {formattedDate} • Puzzle #{puzzle.puzzleIndex}
          </p>
        </div>
        
        <div className="grid gap-4 md:gap-6">
          {/* Morph Chain */}
          <GameCard
            title="Morph Chain"
            description="Solve the daily word ladder puzzle in limited moves"
            icon={Target}
            color="primary"
            onClick={() => navigate('/')}
            badge="Classic"
          />
          
          {/* Morph Rush */}
          <GameCard
            title="Morph Rush"
            description="2-minute score chase. Chain words for multipliers!"
            icon={Zap}
            color="warning"
            onClick={() => navigate('/rush?mode=daily')}
            badge="Timed"
            secondaryAction={{
              label: "Practice",
              onClick: () => navigate('/rush?mode=practice')
            }}
          />
          
          {/* Morph Prism */}
          <GameCard
            title="Morph Prism"
            description="Transform colors through HSL channels"
            icon={Palette}
            color="accent"
            onClick={() => navigate('/prism')}
            badge="Beta"
          />
        </div>
        
        <div className="flex items-center justify-center gap-2 text-xs md:text-sm text-muted-foreground pt-4">
          <Info className="h-4 w-4" />
          <span>All games share the same puzzle number and date</span>
        </div>
      </main>
    </div>
  );
};

interface GameCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'primary' | 'warning' | 'accent';
  onClick: () => void;
  badge?: string;
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

const GameCard = ({ title, description, icon: Icon, color, onClick, badge, secondaryAction }: GameCardProps) => {
  const colorClasses = {
    primary: "bg-primary/10 text-primary border-primary/20",
    warning: "bg-warning/10 text-warning border-warning/20",
    accent: "bg-accent/10 text-accent border-accent/20"
  };
  
  return (
    <Card className={`p-4 md:p-6 hover:border-${color} transition-all cursor-pointer ${colorClasses[color]}`} onClick={onClick}>
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-lg bg-${color}/20`}>
          <Icon className="h-6 w-6 md:h-8 md:w-8" />
        </div>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <h2 className="text-lg md:text-xl font-bold">{title}</h2>
            {badge && (
              <span className="px-2 py-0.5 text-[10px] md:text-xs font-semibold bg-muted rounded-full">
                {badge}
              </span>
            )}
          </div>
          <p className="text-sm md:text-base text-muted-foreground">{description}</p>
          
          {secondaryAction && (
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  secondaryAction.onClick();
                }}
                className="h-8"
              >
                {secondaryAction.label}
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default GameSelector;
