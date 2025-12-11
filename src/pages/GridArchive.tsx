import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ArchiveDatePicker } from "@/components/archive/ArchiveDatePicker";
import { PrestigeThemeToggle } from "@/components/shared/PrestigeThemeToggle";
import { HowToPlayModal } from "@/components/grid/HowToPlayModal";
import { GridTile } from "@/components/grid/GridTile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChevronLeft, HelpCircle, Volume2, VolumeX, Check } from "lucide-react";
import { useGridSettings } from "@/hooks/useGridSettings";
import { generateDailyGrid, Tile } from "@/lib/grid/gridGenerator";
import { SeededRandom } from "@/lib/grid/seededRNG";
import { morphGrid } from "@/lib/grid/morphMechanics";
import { isValidWord } from "@/lib/grid/dictionary";
import { playWordSubmit, playTileUpgrade, initAudio } from "@/lib/grid/audioManager";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Archive-specific storage
const getArchiveGridKey = (date: string) => `morphgrid_archive_${date}`;

interface ArchiveGridState {
  grid: Tile[][];
  submittedWords: { word: string; timestamp: number }[];
  moves: number;
  purpleCount: number;
  isEnded: boolean;
  isWin: boolean;
}

const loadArchiveGridState = (date: string): ArchiveGridState | null => {
  try {
    const key = getArchiveGridKey(date);
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const saveArchiveGridState = (date: string, state: ArchiveGridState) => {
  try {
    const key = getArchiveGridKey(date);
    localStorage.setItem(key, JSON.stringify(state));
  } catch (error) {
    console.error("Failed to save archive grid state:", error);
  }
};

const MAX_MOVES = 20;

// Check if two tiles are adjacent (including diagonals)
const isAdjacent = (tile1: Tile, tile2: Tile): boolean => {
  const rowDiff = Math.abs(tile1.row - tile2.row);
  const colDiff = Math.abs(tile1.col - tile2.col);
  return rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0);
};

const GridArchive = () => {
  const navigate = useNavigate();
  const { settings, updateSetting } = useGridSettings();
  
  // Archive state
  const [archiveDate, setArchiveDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(true);
  
  // Game state
  const [grid, setGrid] = useState<Tile[][]>([]);
  const [selected, setSelected] = useState<Tile[]>([]);
  const [submittedWords, setSubmittedWords] = useState<{ word: string; timestamp: number }[]>([]);
  const [moves, setMoves] = useState(0);
  const [purpleCount, setPurpleCount] = useState(0);
  const [isEnded, setIsEnded] = useState(false);
  const [isWin, setIsWin] = useState(false);
  
  const [showHelp, setShowHelp] = useState(false);
  const [showEndScreen, setShowEndScreen] = useState(false);
  
  const rngRef = useRef<SeededRandom | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Initialize audio
  useEffect(() => {
    const handleFirstInteraction = () => {
      initAudio();
      window.removeEventListener('click', handleFirstInteraction);
    };
    window.addEventListener('click', handleFirstInteraction);
    return () => window.removeEventListener('click', handleFirstInteraction);
  }, []);

  // Initialize game when date is selected
  const initializeArchiveGame = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    
    // Try to load saved state
    const savedState = loadArchiveGridState(dateStr);
    
    if (savedState && savedState.isEnded) {
      // Show completed game
      setGrid(savedState.grid);
      setSubmittedWords(savedState.submittedWords);
      setMoves(savedState.moves);
      setPurpleCount(savedState.purpleCount);
      setIsEnded(true);
      setIsWin(savedState.isWin);
      setShowEndScreen(true);
      rngRef.current = new SeededRandom(dateStr + '-morph');
    } else if (savedState) {
      // Resume in-progress game
      setGrid(savedState.grid);
      setSubmittedWords(savedState.submittedWords);
      setMoves(savedState.moves);
      setPurpleCount(savedState.purpleCount);
      setIsEnded(false);
      setIsWin(false);
      rngRef.current = new SeededRandom(dateStr + '-morph');
    } else {
      // Start fresh
      const newGrid = generateDailyGrid(dateStr);
      setGrid(newGrid);
      setSubmittedWords([]);
      setMoves(0);
      setPurpleCount(0);
      setIsEnded(false);
      setIsWin(false);
      rngRef.current = new SeededRandom(dateStr + '-morph');
    }
    
    setSelected([]);
  };

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    setArchiveDate(date);
    setShowDatePicker(false);
    initializeArchiveGame(date);
  };

  // Tile selection
  const selectTile = (tile: Tile) => {
    if (isEnded) return;
    
    // If clicking the last selected tile, remove it
    if (selected.length > 0 && selected[selected.length - 1].id === tile.id) {
      setSelected(selected.slice(0, -1));
      return;
    }
    
    // Check if already selected
    if (selected.some(t => t.id === tile.id)) return;
    
    // Check adjacency
    if (selected.length > 0) {
      const last = selected[selected.length - 1];
      if (!isAdjacent(last, tile)) return;
    }
    
    setSelected([...selected, tile]);
  };

  // Submit word
  const submitWord = () => {
    if (!archiveDate || !rngRef.current) return false;
    if (selected.length < 4 || isEnded) return false;
    
    const word = selected.map(t => t.char).join('');
    if (!isValidWord(word)) {
      toast.error(`"${word}" is not in the dictionary`, { duration: 2000 });
      return false;
    }
    
    const dateStr = format(archiveDate, "yyyy-MM-dd");
    
    // Advance progress for used tiles
    let newGrid = grid.map(row => row.map(tile => {
      const isUsed = selected.some(s => s.id === tile.id);
      if (isUsed) {
        return {
          ...tile,
          progress: Math.min(2, tile.progress + 1) as 0 | 1 | 2
        };
      }
      return { ...tile };
    }));
    
    // Morph the grid
    const usedCoords = selected.map(t => ({ row: t.row, col: t.col }));
    newGrid = morphGrid(newGrid, usedCoords, rngRef.current);
    
    // Cascade upgrade for 5+ letter words
    const wordLength = selected.length;
    const usedTileIds = selected.map(t => t.id);
    
    if (wordLength >= 5) {
      const bonusTiles = wordLength === 5 ? 1 : wordLength === 6 ? 2 : 3;
      const usedIds = new Set(usedTileIds);
      const candidates: { row: number; col: number; id: string }[] = [];
      
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
          const tile = newGrid[row][col];
          if (tile.progress < 2 && !usedIds.has(tile.id)) {
            candidates.push({ row, col, id: tile.id });
          }
        }
      }
      
      // Shuffle and pick tiles to upgrade
      for (let i = candidates.length - 1; i > 0; i--) {
        const j = Math.floor(rngRef.current.next() * (i + 1));
        [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
      }
      
      const tilesToUpgrade = candidates.slice(0, bonusTiles);
      
      for (const { row, col } of tilesToUpgrade) {
        newGrid[row][col] = {
          ...newGrid[row][col],
          progress: Math.min(2, newGrid[row][col].progress + 1) as 0 | 1 | 2
        };
      }
    }
    
    const newPurpleCount = newGrid.flat().filter(t => t.progress === 2).length;
    const newMoves = moves + 1;
    const gameIsWin = newPurpleCount === 25;
    const gameIsLoss = !gameIsWin && newMoves >= MAX_MOVES;
    const gameEnded = gameIsWin || gameIsLoss;
    
    const newSubmittedWords = [...submittedWords, { word, timestamp: Date.now() }];
    
    // Play sounds
    if (settings.soundEnabled) {
      playWordSubmit(wordLength);
    }
    
    // Update state
    setGrid(newGrid);
    setSubmittedWords(newSubmittedWords);
    setMoves(newMoves);
    setPurpleCount(newPurpleCount);
    setSelected([]);
    
    if (gameEnded) {
      setIsEnded(true);
      setIsWin(gameIsWin);
      setShowEndScreen(true);
    }
    
    // Save state (NO stats, NO achievements, NO backend sync)
    saveArchiveGridState(dateStr, {
      grid: newGrid,
      submittedWords: newSubmittedWords,
      moves: newMoves,
      purpleCount: newPurpleCount,
      isEnded: gameEnded,
      isWin: gameIsWin,
    });
    
    return true;
  };

  const handlePlayAnother = () => {
    setShowDatePicker(true);
    setShowEndScreen(false);
    setArchiveDate(null);
  };

  // Show date picker
  if (showDatePicker) {
    return (
      <ArchiveDatePicker
        onSelectDate={handleDateSelect}
        onBack={() => navigate("/grid")}
        game="grid"
      />
    );
  }

  if (!archiveDate) return null;

  const archiveDateStr = format(archiveDate, "MMM d, yyyy");
  const previewWord = selected.map(t => t.char).join('');
  const isValidSelection = selected.length >= 4 && isValidWord(previewWord);

  return (
    <div 
      className="min-h-dvh max-h-dvh flex flex-col overflow-hidden font-inter"
      style={{ background: 'hsl(var(--grid-page-bg))' }}
    >
      {/* Header */}
      <header 
        className="flex items-center justify-between px-3 py-2 border-b shrink-0"
        style={{ 
          background: 'hsl(var(--grid-card-bg))',
          borderColor: 'hsl(var(--grid-card-border))' 
        }}
      >
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowDatePicker(true)}
            className="h-9 w-9"
            style={{ color: 'hsl(var(--grid-text-secondary))' }}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <PrestigeThemeToggle colorVar="--grid-text-secondary" />
        </div>

        <div className="flex items-center gap-2">
          <Badge 
            variant="outline" 
            className="gap-1 text-xs"
            style={{ 
              borderColor: 'hsl(var(--grid-accent))',
              color: 'hsl(var(--grid-accent))'
            }}
          >
            <Calendar className="w-3 h-3" />
            Archive
          </Badge>
          <span 
            className="font-serif text-sm"
            style={{ color: 'hsl(var(--grid-text-primary))' }}
          >
            {archiveDateStr}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => updateSetting('soundEnabled', !settings.soundEnabled)}
            className="h-9 w-9"
            style={{ color: 'hsl(var(--grid-text-secondary))' }}
          >
            {settings.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowHelp(true)}
            className="h-9 w-9"
            style={{ color: 'hsl(var(--grid-text-secondary))' }}
          >
            <HelpCircle className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Info Strip */}
      <div 
        className="flex items-center justify-between px-4 py-2 border-b text-xs"
        style={{ 
          background: 'hsl(var(--grid-card-bg))',
          borderColor: 'hsl(var(--grid-card-border))',
          color: 'hsl(var(--grid-text-muted))'
        }}
      >
        <span>Moves: {moves}/{MAX_MOVES}</span>
        <span>Purple: {purpleCount}/25</span>
      </div>

      {/* Grid */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        <div className="w-full max-w-[420px] mx-auto">
          <div 
            className="rounded-xl p-5 md:p-6"
            style={{
              background: 'hsl(var(--grid-card-bg))',
              border: '1px solid hsl(var(--grid-card-border))',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
            }}
          >
            <div 
              ref={gridRef}
              className="grid grid-cols-5 gap-2.5 select-none"
              style={{ touchAction: 'none' }}
            >
              {grid.map((row) =>
                row.map((tile) => {
                  const selectedIndex = selected.findIndex(t => t.id === tile.id);
                  const isSelected = selectedIndex !== -1;
                  
                  return (
                    <GridTile
                      key={tile.id}
                      tile={tile}
                      isSelected={isSelected}
                      selectionIndex={isSelected ? selectedIndex : undefined}
                      onClick={() => selectTile(tile)}
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      {!isEnded && (
        <div 
          className="shrink-0 border-t p-4 space-y-3"
          style={{ 
            background: 'hsl(var(--grid-card-bg))',
            borderColor: 'hsl(var(--grid-card-border))' 
          }}
        >
          {/* Word Preview */}
          <div className="flex items-center justify-center py-2 min-h-[3rem]">
            {selected.length > 0 ? (
              <div 
                className={cn(
                  "px-4 py-2 rounded-full font-inter font-semibold text-base tracking-wide transition-all duration-150",
                  "bg-[hsl(var(--grid-pill-bg))]",
                  isValidSelection 
                    ? "text-[hsl(var(--grid-accent))]" 
                    : "text-[hsl(var(--grid-text-secondary))]"
                )}
              >
                <span className="flex items-center gap-2">
                  {previewWord}
                  {isValidSelection && (
                    <Check className="w-4 h-4 text-[hsl(var(--grid-success))]" />
                  )}
                  <span className="text-xs text-[hsl(var(--grid-text-muted))]">
                    ({selected.length})
                  </span>
                </span>
              </div>
            ) : (
              <div className="text-[hsl(var(--grid-text-muted))] text-sm font-inter">
                Tap tiles to form words
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex gap-3 h-12">
            <Button
              variant="ghost"
              onClick={() => setSelected([])}
              disabled={selected.length === 0}
              className="flex-1 h-full text-sm font-inter font-medium rounded-full border border-[hsl(37,20%,82%)] text-[hsl(var(--grid-text-secondary))] hover:bg-[hsl(var(--grid-pill-bg))] disabled:opacity-40"
            >
              Clear
            </Button>
            
            <Button
              onClick={submitWord}
              disabled={!isValidSelection}
              className="flex-[2] h-full text-sm font-inter font-semibold rounded-full disabled:opacity-40 bg-[hsl(var(--grid-accent))] hover:bg-[hsl(193,46%,28%)] text-white shadow-[0_4px_10px_rgba(47,109,128,0.25)]"
            >
              Submit
            </Button>
          </div>
        </div>
      )}

      {/* End Screen */}
      {showEndScreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div 
            className="w-full max-w-md rounded-xl p-6 space-y-4"
            style={{ background: 'hsl(var(--grid-card-bg))' }}
          >
            <div className="text-center space-y-2">
              <h2 
                className="font-serif text-2xl"
                style={{ color: 'hsl(var(--grid-text-primary))' }}
              >
                {isWin ? "Archive Complete!" : "Out of Moves"}
              </h2>
              <p style={{ color: 'hsl(var(--grid-text-muted))' }}>
                {archiveDateStr} puzzle
              </p>
            </div>

            <div 
              className="grid grid-cols-2 gap-4 py-4"
              style={{ color: 'hsl(var(--grid-text-secondary))' }}
            >
              <div className="text-center">
                <div className="text-2xl font-semibold" style={{ color: 'hsl(var(--grid-text-primary))' }}>
                  {moves}
                </div>
                <div className="text-xs">Moves</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold" style={{ color: 'hsl(var(--grid-text-primary))' }}>
                  {submittedWords.length}
                </div>
                <div className="text-xs">Words</div>
              </div>
            </div>

            <div className="space-y-2">
              <Button
                onClick={handlePlayAnother}
                className="w-full"
                style={{ 
                  background: 'hsl(var(--grid-accent))',
                  color: 'white'
                }}
              >
                Play Another Archive Puzzle
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/grid")}
                className="w-full"
                style={{ 
                  borderColor: 'hsl(var(--grid-card-border))',
                  color: 'hsl(var(--grid-text-secondary))'
                }}
              >
                Back to Daily
              </Button>
            </div>

            <p 
              className="text-xs text-center"
              style={{ color: 'hsl(var(--grid-text-muted))' }}
            >
              Archive results don't affect your stats
            </p>
          </div>
        </div>
      )}

      {/* Help Modal */}
      <HowToPlayModal open={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
};

export default GridArchive;
