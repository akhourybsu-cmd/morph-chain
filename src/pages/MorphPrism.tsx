import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Share2, Clock, Sparkles, Info } from "lucide-react";
import { toast } from "sonner";
import { PrismLogo } from "@/components/PrismLogo";
import ChromaTile from "@/components/chromaword/ChromaTile";
import SimilarityMeter from "@/components/chromaword/SimilarityMeter";
import { scoreGuess } from "@/lib/chromawordLogic";
import { VALID_WORDS_5 } from "@/lib/gameLogic";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

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
  const puzzleNumber = 1;
  const today = new Date().toISOString().split('T')[0];
  
  const [rows, setRows] = useState<Guess[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [error, setError] = useState("");
  const [session, setSession] = useState<any>(null);
  
  // Modals
  const [helpOpen, setHelpOpen] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showColorGuide, setShowColorGuide] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

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
      {/* Custom Header - Morph Prism Only */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 md:px-6 py-4 md:py-5">
          <div className="flex items-center justify-between">
            {/* Centered Title */}
            <div className="flex-1 flex justify-center">
              <PrismLogo />
            </div>
            
            {/* Right Actions */}
            <div className="flex items-center gap-2 md:gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setHelpOpen(true)}
                className="gap-2"
              >
                <Info className="h-4 w-4" />
                <span className="hidden sm:inline">Help</span>
              </Button>
              
              {session ? (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => navigate('/profile')}
                >
                  Profile
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => navigate('/login')}
                >
                  Log In
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Puzzle Info Bar */}
      <div className="flex items-center justify-between px-4 md:px-6 py-3 bg-card/30 border-b border-border text-xs md:text-sm">
        <div className="flex items-center gap-2 md:gap-4">
          <span className="font-semibold text-foreground flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 md:h-4 md:w-4" style={{ color: 'hsl(var(--prism-accent-mid))' }} />
            Puzzle #{puzzleNumber}
          </span>
          <span className="text-muted-foreground hidden sm:inline">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </div>
        
        <div className="flex items-center gap-3 md:gap-4">
          <span className="font-mono text-foreground font-semibold">
            {rows.length}/{MAX_GUESSES}
          </span>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-3 w-3 md:h-3.5 md:w-3.5" />
            <span className="font-mono text-xs md:text-sm">{timeUntilMidnight}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 md:px-6 py-6 md:py-8 max-w-3xl">
        <div className="space-y-6 md:space-y-8">
          {/* Color Guide Toggle */}
          <div className="text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowColorGuide(!showColorGuide)}
              className="gap-2"
            >
              <Info className="h-4 w-4" />
              {showColorGuide ? 'Hide' : 'Show'} Color Guide
            </Button>
            
            {/* Inline Color Guide */}
            {showColorGuide && (
              <div className="bg-card border border-border rounded-lg p-4 text-left space-y-3 animate-fade-in">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4" style={{ color: 'hsl(var(--prism-accent-mid))' }} />
                  Color Meaning Guide
                </h3>
                <div className="space-y-2 text-xs md:text-sm">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded border border-border shrink-0" style={{ background: 'hsl(180 80% 60%)' }} />
                    <div>
                      <p className="font-semibold">Bright & Vivid</p>
                      <p className="text-muted-foreground">Letter is in correct position</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded border border-border shrink-0" style={{ background: 'hsl(300 60% 50%)' }} />
                    <div>
                      <p className="font-semibold">Medium Brightness</p>
                      <p className="text-muted-foreground">Letter exists but wrong position</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded border border-border shrink-0" style={{ background: 'hsl(0 20% 35%)' }} />
                    <div>
                      <p className="font-semibold">Dark & Muted</p>
                      <p className="text-muted-foreground">Letter not in word</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-border">
                    <p className="text-muted-foreground italic">
                      <strong>Hue shift:</strong> Color changes toward the target letter on the spectrum (A=red → Z=purple)
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Spectrum Preview Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs md:text-sm text-muted-foreground px-1">
              <span className="font-medium">Spectrum Preview</span>
              {rows.length > 0 && (
                <span className="font-mono">{Math.round((rows[rows.length - 1]?.similarity || 0) * 100)}% aligned</span>
              )}
            </div>
            <div 
              className="h-5 md:h-6 rounded-xl overflow-hidden border border-border shadow-lg transition-all duration-300"
              style={{
                opacity: rows.length > 0 ? 1 : 0.3,
                background: spectrum.length 
                  ? `linear-gradient(90deg, ${spectrum.map(t => t.hex).join(',')})` 
                  : 'hsl(var(--muted))',
                boxShadow: rows.length > 0 ? '0 0 20px rgba(255,255,255,0.1) inset' : 'none'
              }}
            />
          </div>

          {/* Guess Grid */}
          <div className="space-y-4 md:space-y-5">
            {/* Previous guesses */}
            {rows.map((row, idx) => (
              <div key={idx} className="space-y-2.5 animate-fade-in">
                <div className="flex justify-center gap-2 md:gap-3">
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
              <div className="space-y-2.5">
                <div className="flex justify-center gap-2 md:gap-3">
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
              <div key={`empty-${i}`} className="space-y-2.5 opacity-30">
                <div className="flex justify-center gap-2 md:gap-3">
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
            <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
              <div className="flex gap-2 md:gap-3">
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

          {/* Game Status & Share */}
          {gameStatus !== 'playing' && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="gap-2"
              >
                <Share2 className="h-4 w-4" />
                Share Result
              </Button>
            </div>
          )}
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
              <h3 className="font-semibold text-base mb-3">🎨 Color Feedback System</h3>
              <div className="space-y-4">
                <p className="text-muted-foreground">Each letter tile uses chromatic clues to guide you:</p>
                
                {/* Visual examples */}
                <div className="grid gap-3">
                  <div className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border">
                    <div className="h-12 w-12 rounded border border-border shrink-0" style={{ background: 'hsl(180 80% 60%)', boxShadow: '0 0 14px rgba(255,255,255,0.18) inset' }} />
                    <div className="text-sm">
                      <p className="font-semibold">Bright & Vivid</p>
                      <p className="text-muted-foreground">Letter is in the correct position</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border">
                    <div className="h-12 w-12 rounded border border-border shrink-0" style={{ background: 'hsl(300 60% 50%)' }} />
                    <div className="text-sm">
                      <p className="font-semibold">Medium Brightness</p>
                      <p className="text-muted-foreground">Letter exists in the word but wrong position</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-card rounded-lg border border-border">
                    <div className="h-12 w-12 rounded border border-border shrink-0" style={{ background: 'hsl(0 20% 35%)' }} />
                    <div className="text-sm">
                      <p className="font-semibold">Dark & Muted</p>
                      <p className="text-muted-foreground">Letter is not in the word at all</p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-2 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    <strong>Bonus Clue:</strong> The hue (color tone) shifts toward the target letter's position on the color spectrum (A=red, M=green, Z=purple).
                  </p>
                </div>
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
