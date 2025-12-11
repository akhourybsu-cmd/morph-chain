import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Share2, Clock, Sparkles, Info, Lock, Menu } from "lucide-react";
import { toast } from "sonner";
import { PrismLogo } from "@/components/PrismLogo";
import { useUserRole } from "@/hooks/useUserRole";
import ChromaTile from "@/components/chromaword/ChromaTile";
import SimilarityMeter from "@/components/chromaword/SimilarityMeter";
import { scoreGuess } from "@/lib/chromawordLogic";
import { VALID_WORDS_5 } from "@/lib/gameLogic";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import OnScreenKeyboard from "@/components/prism/OnScreenKeyboard";
import { PrismMenuSheet } from "@/components/prism/PrismMenuSheet";

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
  const { hasBetaAccess, loading } = useUserRole();
  const puzzleNumber = 1;
  const today = new Date().toISOString().split('T')[0];
  
  const [rows, setRows] = useState<Guess[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [error, setError] = useState("");
  const [session, setSession] = useState<any>(null);
  
  // Modals
  const [menuOpen, setMenuOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showColorGuide, setShowColorGuide] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);
  
  // Redirect if user doesn't have beta access
  useEffect(() => {
    if (!loading && !hasBetaAccess) {
      navigate("/");
    }
  }, [loading, hasBetaAccess, navigate]);

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

  // Track used letters for keyboard feedback
  const { usedLetters, correctLetters, wrongPositionLetters } = useMemo(() => {
    const used = new Set<string>();
    const correct = new Set<string>();
    const wrongPos = new Set<string>();
    
    rows.forEach(row => {
      row.word.split('').forEach((letter, idx) => {
        used.add(letter);
        if (DEFAULT_TARGET[idx] === letter) {
          correct.add(letter);
        } else if (DEFAULT_TARGET.includes(letter)) {
          wrongPos.add(letter);
        }
      });
    });
    
    return { usedLetters: used, correctLetters: correct, wrongPositionLetters: wrongPos };
  }, [rows]);

  const submitGuess = () => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitGuess();
  };

  const handleKeyPress = (key: string) => {
    if (currentInput.length < WORD_LENGTH) {
      setCurrentInput(prev => prev + key);
    }
  };

  const handleBackspace = () => {
    setCurrentInput(prev => prev.slice(0, -1));
  };

  const handleShare = () => {
    const shareText = `Morph Prism #${puzzleNumber}\n${gameStatus === 'won' ? `✨ Solved in ${rows.length}/${MAX_GUESSES}` : `❌ ${rows.length}/${MAX_GUESSES}`}\n\nSpectrum Alignment: ${Math.round((rows[rows.length - 1]?.similarity || 0) * 100)}%\n\nmorphchaingame.com`;
    
    if (navigator.share) {
      navigator.share({ text: shareText });
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success("Copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background via-background to-card">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background to-card">
      {/* Header with all controls on one line */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-3 md:px-4 py-3 md:py-4">
          <div className="flex items-center justify-between gap-2 md:gap-4">
            {/* Left: Menu, Help & Color Guide */}
            <div className="flex items-center gap-1 md:gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMenuOpen(true)}
                className="gap-1.5 text-xs md:text-sm px-2 md:px-3 h-8"
              >
                <Menu className="h-3.5 w-3.5 md:h-4 md:w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setHelpOpen(true)}
                className="gap-1.5 text-xs md:text-sm px-2 md:px-3 h-8"
              >
                <Info className="h-3.5 w-3.5 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Help</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowColorGuide(!showColorGuide)}
                className="px-2 md:px-3 h-8"
              >
                <Sparkles className="h-3.5 w-3.5 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Guide</span>
              </Button>
            </div>
            
            {/* Center: Title */}
            <div className="flex-1 flex justify-center">
              <PrismLogo />
            </div>
            
            {/* Right: Auth */}
            <div className="flex items-center gap-1 md:gap-2">
              {session ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/profile')}
                  className="text-xs md:text-sm px-2 md:px-3 h-8"
                >
                  Profile
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/login')}
                  className="text-xs md:text-sm px-2 md:px-3 h-8"
                >
                  Log In
                </Button>
              )}
          </div>
          
          {/* Menu Sheet */}
          <PrismMenuSheet open={menuOpen} onOpenChange={setMenuOpen} />
          </div>
        </div>
      </header>

      {/* Puzzle Info Bar */}
      <div className="flex items-center justify-between px-3 md:px-4 py-2 md:py-2.5 bg-card/30 border-b border-border text-xs md:text-sm">
        <div className="flex items-center gap-2 md:gap-3">
          <span className="font-semibold text-foreground">
            Puzzle #{puzzleNumber}
          </span>
          <span className="text-muted-foreground hidden sm:inline">•</span>
          <span className="font-mono text-foreground font-semibold hidden sm:inline">
            {rows.length}/{MAX_GUESSES}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="h-3 w-3 md:h-3.5 md:w-3.5" />
          <span className="font-mono text-xs md:text-sm">{timeUntilMidnight}</span>
        </div>
      </div>

      {/* Main Content - Wordle Style Layout */}
      <main className="flex-1 flex flex-col container mx-auto px-3 md:px-4 py-3 md:py-4 max-w-lg">
        {/* Compact Color Guide */}
        {showColorGuide && (
          <div className="bg-card/50 border border-border rounded-lg p-3 md:p-4 animate-fade-in">
            <div className="grid grid-cols-3 gap-2 text-[10px] md:text-xs">
              <div className="text-center space-y-1">
                <div className="h-10 w-full rounded border border-border mx-auto" style={{ background: 'hsl(180 80% 60%)' }} />
                <p className="font-semibold text-[9px] md:text-[10px]">Correct Position</p>
              </div>
              <div className="text-center space-y-1">
                <div className="h-10 w-full rounded border border-border mx-auto" style={{ background: 'hsl(300 60% 50%)' }} />
                <p className="font-semibold text-[9px] md:text-[10px]">Wrong Position</p>
              </div>
              <div className="text-center space-y-1">
                <div className="h-10 w-full rounded border border-border mx-auto" style={{ background: 'hsl(0 20% 35%)' }} />
                <p className="font-semibold text-[9px] md:text-[10px]">Not in Word</p>
              </div>
            </div>
          </div>
        )}

        {/* Wordle-style Grid - Centered */}
        <div className="flex-1 flex flex-col justify-center space-y-2 md:space-y-2.5 py-2">
          {/* Previous guesses */}
          {rows.map((row, idx) => (
            <div key={idx} className="flex justify-center gap-1.5 md:gap-2 animate-fade-in">
              {Array.from({ length: WORD_LENGTH }).map((_, i) => (
                <ChromaTile
                  key={i}
                  letter={row.word[i] || ''}
                  bgHex={row.colors[i] || 'transparent'}
                  glow
                />
              ))}
            </div>
          ))}

          {/* Current input row */}
          {gameStatus === 'playing' && rows.length < MAX_GUESSES && (
            <div className="flex justify-center gap-1.5 md:gap-2">
              {Array.from({ length: WORD_LENGTH }).map((_, i) => (
                <ChromaTile
                  key={i}
                  letter={currentInput[i] || ''}
                  bgHex="transparent"
                />
              ))}
            </div>
          )}

          {/* Empty rows */}
          {Array.from({ 
            length: Math.max(0, MAX_GUESSES - rows.length - (gameStatus === 'playing' ? 1 : 0)) 
          }).map((_, i) => (
            <div key={`empty-${i}`} className="flex justify-center gap-1.5 md:gap-2 opacity-20">
              {Array.from({ length: WORD_LENGTH }).map((_, j) => (
                <ChromaTile key={j} letter="" bgHex="transparent" />
              ))}
            </div>
          ))}
        </div>

        {/* Bottom Section - Input & Status */}
        <div className="space-y-2 md:space-y-3">
          {/* Similarity Bar */}
          {rows.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] md:text-xs text-muted-foreground">
                <span>Alignment</span>
                <span className="font-mono font-semibold">{Math.round((rows[rows.length - 1]?.similarity || 0) * 100)}%</span>
              </div>
              <SimilarityMeter value={rows[rows.length - 1]?.similarity || 0} />
            </div>
          )}

          {/* Current word display */}
          {gameStatus === 'playing' && (
            <div className="space-y-3">
              <div className="flex justify-center gap-1.5 md:gap-2 py-2">
                {Array.from({ length: WORD_LENGTH }).map((_, i) => (
                  <div
                    key={i}
                    className="h-12 md:h-14 w-12 md:w-14 border-2 border-border rounded bg-card/50 flex items-center justify-center text-lg md:text-2xl font-bold"
                  >
                    {currentInput[i] || ''}
                  </div>
                ))}
              </div>
              {error && (
                <p className="text-xs md:text-sm text-destructive text-center font-semibold animate-fade-in">
                  {error}
                </p>
              )}
            </div>
          )}

          {/* On-screen Keyboard */}
          {gameStatus === 'playing' && (
            <OnScreenKeyboard
              onKeyPress={handleKeyPress}
              onBackspace={handleBackspace}
              onEnter={submitGuess}
              disabled={gameStatus !== 'playing'}
              usedLetters={usedLetters}
              correctLetters={correctLetters}
              wrongPositionLetters={wrongPositionLetters}
            />
          )}

          {/* Share Button */}
          {gameStatus !== 'playing' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="w-full gap-2"
            >
              <Share2 className="h-4 w-4" />
              Share Result
            </Button>
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
