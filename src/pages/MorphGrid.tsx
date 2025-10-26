import { useEffect, useState } from 'react';
import { useGridStore } from '@/stores/gridStore';
import { loadDictionary, isDictionaryLoaded } from '@/lib/grid/dictionary';
import { GridView } from '@/components/grid/GridView';
import { WordPreview } from '@/components/grid/WordPreview';
import { ScoreDisplay } from '@/components/grid/ScoreDisplay';
import { GameControls } from '@/components/grid/GameControls';
import { EndScreen } from '@/components/grid/EndScreen';
import { HowToPlayModal } from '@/components/grid/HowToPlayModal';
import { GridLogo } from '@/components/GridLogo';
import { Button } from '@/components/ui/button';
import { Menu, HelpCircle } from 'lucide-react';
import { formatInTimeZone } from 'date-fns-tz';
import { toast } from 'sonner';

const MorphGrid = () => {
  const { initializeGame, isEnded, dailySeed } = useGridStore();
  const [isLoading, setIsLoading] = useState(true);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showEndScreen, setShowEndScreen] = useState(false);
  
  useEffect(() => {
    const init = async () => {
      try {
        await loadDictionary();
        
        if (!isDictionaryLoaded()) {
          toast.error('Failed to load dictionary');
          return;
        }
        
        const timezone = "America/New_York";
        const today = formatInTimeZone(new Date(), timezone, 'yyyy-MM-dd');
        
        initializeGame(today);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize game:', error);
        toast.error('Failed to start game');
      }
    };
    
    init();
  }, [initializeGame]);
  
  useEffect(() => {
    if (isEnded) {
      setShowEndScreen(true);
    }
  }, [isEnded]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-outfit font-bold mb-2">Loading MORPH GRID...</div>
          <div className="text-muted-foreground">Preparing today's puzzle</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between">
          <GridLogo className="scale-90 sm:scale-100" />
          
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowHowToPlay(true)}
              aria-label="How to play"
              className="h-9 w-9 sm:h-10 sm:w-10"
            >
              <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
        </div>
      </header>
      
      {/* Date Banner */}
      <div className="bg-primary/10 border-b border-primary/20 py-1.5 sm:py-2 text-center">
        <div className="text-xs sm:text-sm font-medium">
          Daily Puzzle — {dailySeed}
        </div>
      </div>
      
      {/* Main Game */}
      <main className="flex-1 container mx-auto px-2 sm:px-4 py-3 sm:py-6 max-w-2xl">
        <div className="space-y-3 sm:space-y-6">
          <ScoreDisplay />
          <GridView />
          <WordPreview />
          <GameControls />
        </div>
      </main>
      
      {/* Modals */}
      <HowToPlayModal open={showHowToPlay} onClose={() => setShowHowToPlay(false)} />
      <EndScreen open={showEndScreen} onClose={() => setShowEndScreen(false)} />
    </div>
  );
};

export default MorphGrid;
