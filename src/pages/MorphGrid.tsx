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
import { WordLengthTracker } from '@/components/grid/WordLengthTracker';
import { WordCelebration } from '@/components/grid/WordCelebration';
import { GridThemeToggle } from '@/components/grid/GridThemeToggle';
import { Button } from '@/components/ui/button';
import { HelpCircle, Volume2, VolumeX } from 'lucide-react';
import { formatInTimeZone } from 'date-fns-tz';
import { toast } from 'sonner';
import { useGridLayout } from '@/hooks/useGridLayout';
import { useGridSettings } from '@/hooks/useGridSettings';

const MorphGrid = () => {
  const { initializeGame, isEnded, dailySeed, submittedWords } = useGridStore();
  const { settings, updateSetting } = useGridSettings();
  const [isLoading, setIsLoading] = useState(true);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showEndScreen, setShowEndScreen] = useState(false);
  
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
      <div 
        className="min-h-svh flex items-center justify-center"
        style={{ background: 'hsl(var(--grid-page-bg))' }}
      >
        <div className="text-center">
          <div className="text-2xl font-playfair font-semibold mb-2 text-[hsl(var(--grid-text-primary))]">
            Loading Morph Grid...
          </div>
          <div className="text-[hsl(var(--grid-text-muted))] font-inter">Preparing today's puzzle</div>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className="min-h-svh max-h-svh flex flex-col overflow-hidden max-w-xl mx-auto"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        background: 'hsl(var(--grid-page-bg))'
      }}
    >
      {/* Header - NYT Style */}
      <header 
        className="h-14 md:h-16 border-b flex-shrink-0"
        style={{ 
          borderColor: 'hsl(var(--grid-card-border))',
          background: 'hsl(var(--grid-page-bg))'
        }}
      >
        <div className="px-3 md:px-4 h-full flex items-center">
          {/* Left: Menu + Theme Toggle */}
          <div className="flex items-center gap-1">
            <GridMenuSheet />
            <GridThemeToggle />
          </div>
          
          {/* Center spacer */}
          <div className="flex-1" />
          
          {/* Center: Logo */}
          <GridLogo />
          
          {/* Center spacer */}
          <div className="flex-1" />
          
          {/* Right: Sound + Help */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => updateSetting('soundEnabled', !settings.soundEnabled)}
              aria-label={settings.soundEnabled ? "Mute sound" : "Unmute sound"}
              className="h-9 w-9 md:h-10 md:w-10 text-[hsl(var(--grid-text-secondary))] hover:text-[hsl(var(--grid-text-primary))] hover:bg-[hsl(var(--grid-pill-bg))]"
            >
              {settings.soundEnabled ? (
                <Volume2 className="w-4 h-4 md:w-5 md:h-5" />
              ) : (
                <VolumeX className="w-4 h-4 md:w-5 md:h-5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowHowToPlay(true)}
              aria-label="How to play"
              className="h-9 w-9 md:h-10 md:w-10 text-[hsl(var(--grid-text-secondary))] hover:text-[hsl(var(--grid-text-primary))] hover:bg-[hsl(var(--grid-pill-bg))]"
            >
              <HelpCircle className="w-4 h-4 md:w-5 md:h-5" />
            </Button>
          </div>
        </div>
      </header>
      
      {/* Info Strip - NYT Style */}
      <div 
        className="h-10 border-b px-2 md:px-4 flex justify-center items-center gap-1.5 md:gap-3 text-xs md:text-sm flex-shrink-0 flex-nowrap whitespace-nowrap"
        style={{ 
          borderColor: 'hsl(var(--grid-divider))',
          background: 'hsl(var(--grid-card-bg))'
        }}
      >
        <span className="text-[hsl(var(--grid-text-muted))] font-inter">#{dailySeed}</span>
        <span className="text-[hsl(var(--grid-divider))]">·</span>
        <ScoreDisplay compact />
      </div>
      
      {/* Main Game - Centered grid */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-1 flex items-center justify-center px-4 md:px-6 py-4 md:py-6">
          <GridView />
        </div>
      </main>
      
      {/* Bottom Controls Card - NYT Style */}
      <div 
        className="border-t px-4 md:px-6 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-4 flex flex-col gap-3 flex-shrink-0"
        style={{ 
          borderColor: 'hsl(var(--grid-card-border))',
          background: 'hsl(var(--grid-card-bg))'
        }}
      >
        {/* Word Length Tracker */}
        <WordLengthTracker submittedWords={submittedWords} />
        
        {/* Color Legend - NYT Style */}
        <div className="flex items-center justify-center gap-3 text-xs font-inter text-[hsl(var(--grid-text-muted))]">
          <span>Progress:</span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-[hsl(var(--grid-tier1))]" />
              <span>Tier 1</span>
            </div>
            <span>→</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-[hsl(var(--grid-tier2))]" />
              <span>Tier 2</span>
            </div>
            <span>→</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-[hsl(var(--grid-tier3))]" />
              <span>Tier 3</span>
            </div>
          </div>
        </div>
        
        <WordPreview />
        <GameControls />
      </div>
      
      {/* Word Celebration Overlay */}
      <WordCelebration />
      
      {/* Modals */}
      <HowToPlayModal open={showHowToPlay} onClose={() => setShowHowToPlay(false)} />
      <EndScreen open={showEndScreen} onClose={() => setShowEndScreen(false)} />
    </div>
  );
};

export default MorphGrid;
