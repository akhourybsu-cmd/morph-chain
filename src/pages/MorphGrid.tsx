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
import { GridLeaderboard } from '@/components/grid/GridLeaderboard';
import { GridStatsModal } from '@/components/grid/GridStats';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { HelpCircle } from 'lucide-react';
import { formatInTimeZone } from 'date-fns-tz';
import { toast } from 'sonner';
import { useGridLayout } from '@/hooks/useGridLayout';

const MorphGrid = () => {
  const { initializeGame, isEnded, dailySeed } = useGridStore();
  const [isLoading, setIsLoading] = useState(true);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showEndScreen, setShowEndScreen] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [activeTab, setActiveTab] = useState("play");
  
  // Calculate responsive grid layout
  useGridLayout();
  
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
      <div className="min-h-svh flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-2xl font-outfit font-bold mb-2">Loading MORPH GRID...</div>
          <div className="text-muted-foreground">Preparing today's puzzle</div>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className="min-h-svh max-h-svh flex flex-col bg-background overflow-hidden"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}
    >
      {/* Header - Fixed 64px */}
      <header className="h-14 md:h-16 border-b border-border/50 bg-background/95 backdrop-blur-md flex-shrink-0">
        <div className="px-3 md:px-4 h-full flex items-center justify-between">
          <GridMenuSheet />
          
          <GridLogo />
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowHowToPlay(true)}
            aria-label="How to play"
            className="h-9 w-9 md:h-10 md:w-10"
          >
            <HelpCircle className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
        </div>
      </header>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-full grid grid-cols-3 rounded-none border-b flex-shrink-0">
          <TabsTrigger value="play">Play</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="stats" onClick={() => setShowStats(true)}>Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="play" className="flex-1 flex flex-col min-h-0 mt-0">
          {/* Date & Score Bar - Fixed 36px */}
          <div className="h-9 bg-card/50 border-b border-border/30 px-3 md:px-4 flex justify-between items-center text-xs md:text-sm flex-shrink-0">
            <span className="text-muted-foreground">Daily #{dailySeed}</span>
            <ScoreDisplay compact />
          </div>
          
          {/* Main Game - Flexible, centered grid */}
          <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="flex-1 flex items-center justify-center px-3 md:px-6 py-3 md:py-4">
              <GridView />
            </div>
          </main>
          
          {/* Bottom Bar - Fixed with safe area */}
          <div className="bg-background/95 backdrop-blur-md border-t border-border/50 px-3 md:px-6 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-3 flex flex-col gap-2 flex-shrink-0">
            <WordPreview />
            <GameControls />
          </div>
        </TabsContent>

        <TabsContent value="leaderboard" className="flex-1 overflow-y-auto mt-0 px-3 md:px-6 py-3">
          <GridLeaderboard dateSeed={dailySeed} />
        </TabsContent>
      </Tabs>
      
      {/* Modals */}
      <HowToPlayModal open={showHowToPlay} onClose={() => setShowHowToPlay(false)} />
      <EndScreen open={showEndScreen} onClose={() => setShowEndScreen(false)} />
      <GridStatsModal open={showStats} onOpenChange={setShowStats} />
    </div>
  );
};

export default MorphGrid;
