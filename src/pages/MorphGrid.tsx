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
import { GridMenuSheet } from '@/components/grid/GridMenuSheet';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';
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
    <div className="min-h-screen flex flex-col bg-background overflow-hidden">
      {/* Header - Sticky with glass blur */}
      <header className="border-b border-border/50 bg-background/95 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
          <GridMenuSheet />
          
          <div className="flex flex-col items-center gap-0.5">
            <GridLogo />
            <span className="text-[10px] sm:text-xs text-muted-foreground tracking-wide">
              A letter changes everything.
            </span>
          </div>
          
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
      </header>
      
      {/* Date & Score Banner */}
      <div className="bg-card/50 border-b border-border/30 px-3 py-2 flex justify-between items-center text-xs sm:text-sm">
        <span className="text-muted-foreground">Daily #{dailySeed}</span>
        <ScoreDisplay compact />
      </div>
      
      {/* Main Game - Single screen layout */}
      <main className="flex-1 flex flex-col px-2 sm:px-4 pt-3 pb-2 max-w-2xl mx-auto w-full">
        <div className="flex-1 flex flex-col justify-center gap-3 sm:gap-4">
          <GridView />
        </div>
        
        {/* Sticky Bottom Bar */}
        <div className="sticky bottom-0 bg-background/95 backdrop-blur-md border-t border-border/50 -mx-2 sm:-mx-4 px-2 sm:px-4 py-2 sm:py-3">
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
