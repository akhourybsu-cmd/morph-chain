import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { GameHeader } from "@/components/GameHeader";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Share2, Eye, EyeOff, Clock, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { PrismLogo } from "@/components/PrismLogo";
import ChromaTile from "@/components/chromaword/ChromaTile";
import SimilarityMeter from "@/components/chromaword/SimilarityMeter";
import { scoreGuess } from "@/lib/chromawordLogic";
import { VALID_WORDS_5 } from "@/lib/gameLogic";
import { Input } from "@/components/ui/input";

const DEFAULT_TARGET = "SHINE";
const WORD_LENGTH = 5;
const MAX_GUESSES = 6;

type Guess = { 
  word: string; 
  colors: string[]; 
  similarity: number;
  timestamp: Date;
}

export default function MorphPrism() {
  const navigate = useNavigate();
  const puzzleNumber = 1; // TODO: Calculate from date
  const today = new Date().toISOString().split('T')[0];
  
  const [rows, setRows] = useState<Guess[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [showSymbols, setShowSymbols] = useState(false);
  const [error, setError] = useState("");
  
  // Modals
  const [helpOpen, setHelpOpen] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Timer countdown to next puzzle
  const [timeUntilMidnight, setTimeUntilMidnight] = useState("");

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const nyTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
      const tomorrow = new Date(nyTime);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const diff = tomorrow.getTime() - nyTime.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeUntilMidnight(`${hours}h ${minutes}m`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, []);

  const spectrum = useMemo(() => {
    if (!rows.length) return [];
    return scoreGuess(rows[rows.length-1].word, DEFAULT_TARGET).tiles;
  }, [rows]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (gameStatus !== 'playing') return;
    
    const word = currentInput.trim().toUpperCase();
    setError("");
    
    if (word.length !== WORD_LENGTH) {
      setError(`Word must be ${WORD_LENGTH} letters`);
      toast.error(`Word must be ${WORD_LENGTH} letters`);
      return;
    }

    if (!VALID_WORDS_5.has(word)) {
      setError("Not in word list");
      toast.error("Not in word list");
      return;
    }

    if (rows.some(r => r.word === word)) {
      setError("Already guessed");
      toast.error("Already guessed");
      return;
    }

    const scored = scoreGuess(word, DEFAULT_TARGET);
    const colors = scored.tiles.map(t => t.hex);
    const guess: Guess = { word, colors, similarity: scored.similarity, timestamp: new Date() };
    
    const newRows = [...rows, guess];
    setRows(newRows);
    setCurrentInput("");

    if (scored.win) {
      setGameStatus('won');
      setShowResults(true);
      toast.success(`✨ Prism Complete! Solved in ${newRows.length}/${MAX_GUESSES}!`);
    } else if (newRows.length >= MAX_GUESSES) {
      setGameStatus('lost');
      setShowResults(true);
      toast.error(`The word was ${DEFAULT_TARGET}`);
    }
  };

  const handleShare = () => {
    const shareText = `Morph Prism #${puzzleNumber}\n${gameStatus === 'won' ? `✨ Solved in ${rows.length}/${MAX_GUESSES}` : `❌ ${rows.length}/${MAX_GUESSES}`}\n\nSpectrum Alignment: ${Math.round((rows[rows.length - 1]?.similarity || 0) * 100)}%\n\nPlay at morphgames.app`;
    
    if (navigator.share) {
      navigator.share({ text: shareText });
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success("Copied to clipboard!");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background to-card">
      {/* Header */}
      <GameHeader 
        onOpenSettings={() => navigate('/')}
        onOpenStats={() => navigate('/')}
        onOpenHelp={() => setHelpOpen(true)}
      />

      {/* Puzzle Info Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-card/30 border-b border-border text-xs">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-foreground flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-prism-accent-mid" />
            Puzzle #{puzzleNumber}
          </span>
          <span className="text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} (NY)
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="font-mono text-foreground">
            {rows.length}/{MAX_GUESSES}
          </span>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span className="font-mono">{timeUntilMidnight}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6 max-w-2xl">
        <div className="space-y-6">
          {/* Game Title */}
          <div className="text-center space-y-2">
            <PrismLogo />
            <p className="text-sm text-muted-foreground">
              Decode the word through spectral color feedback
            </p>
          </div>

          {/* Spectrum Preview Bar */}
          <div 
            className="h-3 rounded-full overflow-hidden border border-border/50 transition-opacity duration-300"
            style={{
              opacity: rows.length > 0 ? 1 : 0.2,
              background: spectrum.length 
                ? `linear-gradient(90deg, ${spectrum.map(t => t.hex).join(',')})` 
                : 'hsl(var(--muted))'
            }}
          />

          {/* Guess Grid */}
          <div className="space-y-3">
            {/* Previous guesses */}
            {rows.map((row, idx) => (
              <div key={idx} className="space-y-2 animate-fade-in">
                <div className="flex justify-center gap-2">
                  {Array.from({ length: WORD_LENGTH }).map((_, i) => (
                    <ChromaTile
                      key={i}
                      letter={row.word[i] || ''}
                      bgHex={row.colors[i] || 'transparent'}
                      glow
                    />
                  ))}
                </div>
                <SimilarityMeter value={row.similarity} />
              </div>
            ))}

            {/* Current input row */}
            {gameStatus === 'playing' && rows.length < MAX_GUESSES && (
              <div className="space-y-2">
                <div className="flex justify-center gap-2">
                  {Array.from({ length: WORD_LENGTH }).map((_, i) => (
                    <ChromaTile
                      key={i}
                      letter={currentInput[i] || ''}
                      bgHex="transparent"
                    />
                  ))}
                </div>
                <SimilarityMeter value={0} />
              </div>
            )}

            {/* Empty rows */}
            {Array.from({ 
              length: Math.max(0, MAX_GUESSES - rows.length - (gameStatus === 'playing' ? 1 : 0)) 
            }).map((_, i) => (
              <div key={`empty-${i}`} className="space-y-2 opacity-30">
                <div className="flex justify-center gap-2">
                  {Array.from({ length: WORD_LENGTH }).map((_, j) => (
                    <ChromaTile key={j} letter="" bgHex="transparent" />
                  ))}
                </div>
                <SimilarityMeter value={0} />
              </div>
            ))}
          </div>

          {/* Input Area */}
          {gameStatus === 'playing' && (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, WORD_LENGTH))}
                  placeholder="TYPE HERE"
                  className="flex-1 text-center font-bold text-lg tracking-widest uppercase"
                  maxLength={WORD_LENGTH}
                  autoFocus
                />
                <Button 
                  type="submit"
                  className="px-6 bg-gradient-to-r from-prism-accent-start via-prism-accent-mid to-prism-accent-end hover:opacity-90"
                >
                  Submit
                </Button>
              </div>
              {error && (
                <p className="text-sm text-destructive text-center animate-fade-in">
                  {error}
                </p>
              )}
            </form>
          )}

          {/* Controls */}
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSymbols(!showSymbols)}
            >
              {showSymbols ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {showSymbols ? 'Hide' : 'Show'} Symbols
            </Button>
            
            {gameStatus !== 'playing' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share Result
              </Button>
            )}
          </div>

          {/* Legend */}
          <div className="text-center text-xs text-muted-foreground px-4">
            <p>Color intensity ≈ presence/position • Hue ≈ letter proximity • Bar ≈ alignment</p>
          </div>
        </div>
      </main>

      {/* Custom How to Play for Prism */}
      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">
              {gameStatus === 'won' ? '✨ Prism Complete!' : '💫 Almost There!'}
            </DialogTitle>
            <DialogDescription className="text-center">
              {gameStatus === 'won' 
                ? `You solved it in ${rows.length} ${rows.length === 1 ? 'guess' : 'guesses'}!`
                : `The word was ${DEFAULT_TARGET}`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Final spectrum */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-center">Final Spectrum</p>
              <div 
                className="h-12 rounded-lg overflow-hidden border border-border"
                style={{
                  background: spectrum.length 
                    ? `linear-gradient(90deg, ${spectrum.map(t => t.hex).join(',')})` 
                    : 'hsl(var(--muted))'
                }}
              />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-card rounded-lg border border-border">
                <p className="text-2xl font-bold">{rows.length}</p>
                <p className="text-xs text-muted-foreground">Guesses</p>
              </div>
              <div className="p-3 bg-card rounded-lg border border-border">
                <p className="text-2xl font-bold">
                  {Math.round((rows[rows.length - 1]?.similarity || 0) * 100)}%
                </p>
                <p className="text-xs text-muted-foreground">Final Alignment</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button 
                className="flex-1 bg-gradient-to-r from-prism-accent-start via-prism-accent-mid to-prism-accent-end"
                onClick={() => navigate('/')}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                More Games
              </Button>
            </div>

            {/* Next puzzle timer */}
            <p className="text-xs text-center text-muted-foreground">
              Next puzzle in {timeUntilMidnight}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Custom How to Play for Prism */}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">How to Play Morph Prism</DialogTitle>
            <DialogDescription>
              Decode the word using spectral color feedback
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4 text-sm">
            <section>
              <h3 className="font-semibold text-base mb-2">🎯 Objective</h3>
              <p className="text-muted-foreground">
                Guess the {WORD_LENGTH}-letter word in {MAX_GUESSES} tries or less. Each guess reveals spectral color feedback to guide you to the solution.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">🎨 Color Feedback</h3>
              <div className="space-y-3">
                <p className="text-muted-foreground">Each letter tile shows a unique color based on:</p>
                <ul className="space-y-2 ml-4">
                  <li className="flex items-start gap-2 text-muted-foreground">
                    <span className="text-primary">•</span>
                    <span><strong>Hue:</strong> Letters map to a color wheel (A=red → Z=purple). Tiles blend toward the target letter's hue.</span>
                  </li>
                  <li className="flex items-start gap-2 text-muted-foreground">
                    <span className="text-primary">•</span>
                    <span><strong>Saturation:</strong> Vibrant colors = letter is in the word. Dull colors = letter is not in the word.</span>
                  </li>
                  <li className="flex items-start gap-2 text-muted-foreground">
                    <span className="text-primary">•</span>
                    <span><strong>Brightness:</strong> Brightest = correct position. Medium = in word but wrong position. Dim = not in word.</span>
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">📊 Similarity Meter</h3>
              <p className="text-muted-foreground">
                Each guess shows a spectrum alignment percentage (0-100%). Higher percentages mean you're closer to the target word.
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">💡 Strategy Tips</h3>
              <ul className="space-y-2 ml-4 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Start with common letters to gather information</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Pay attention to both color and brightness of tiles</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Watch the similarity percentage to track your progress</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Use the alphabet color wheel to predict letter colors</span>
                </li>
              </ul>
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
