import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { HelpCircle, Share2, Eye } from "lucide-react";
import { toast } from "sonner";
import { PrismLogo } from "@/components/PrismLogo";
import { ChromaTile } from "@/components/chromaword/ChromaTile";
import { ChromaKeyboard } from "@/components/chromaword/ChromaKeyboard";
import { SimilarityMeter } from "@/components/chromaword/SimilarityMeter";
import { getTodaysPuzzle, scoreGuess, GuessResult } from "@/lib/chromawordLogic";
import { VALID_WORDS_5 } from "@/lib/gameLogic";

export default function MorphPrism() {
  const navigate = useNavigate();
  const puzzle = getTodaysPuzzle();
  
  const [guesses, setGuesses] = useState<GuessResult[]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showSymbols, setShowSymbols] = useState(false);

  // Keyboard event listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStatus !== 'playing') return;

      if (e.key === 'Enter') {
        handleSubmitGuess();
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        handleKeyPress(e.key.toUpperCase());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentGuess, gameStatus, guesses]);

  const handleKeyPress = (key: string) => {
    if (currentGuess.length < puzzle.length) {
      setCurrentGuess(prev => prev + key);
    }
  };

  const handleBackspace = () => {
    setCurrentGuess(prev => prev.slice(0, -1));
  };

  const handleSubmitGuess = () => {
    if (currentGuess.length !== puzzle.length) {
      toast.error(`Word must be ${puzzle.length} letters`);
      return;
    }

    const upperGuess = currentGuess.toUpperCase();
    
    // Validate against dictionary
    if (!VALID_WORDS_5.has(upperGuess.toLowerCase())) {
      toast.error("Not in word list");
      return;
    }

    const result = scoreGuess(
      upperGuess,
      puzzle.target,
      puzzle.weights,
      guesses.length,
      puzzle.maxGuesses
    );

    setGuesses(prev => [...prev, result]);
    setCurrentGuess("");

    if (result.win) {
      setGameStatus('won');
      toast.success(`Amazing! You solved it in ${guesses.length + 1} ${guesses.length === 0 ? 'guess' : 'guesses'}!`);
    } else if (guesses.length + 1 >= puzzle.maxGuesses) {
      setGameStatus('lost');
      toast.error(`Game over! The word was ${puzzle.target}`);
    }
  };

  const handleShare = () => {
    const shareText = `CHROMAWORD — Morph Prism\nPuzzle ${puzzle.id}\nSolved in ${guesses.length}/${puzzle.maxGuesses}\nSpectrum Alignment: ${Math.round((guesses[guesses.length - 1]?.similarity || 0) * 100)}%\n#ChromaWord #MorphPrism`;
    
    if (navigator.share) {
      navigator.share({ text: shareText });
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success("Copied to clipboard!");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <PrismLogo />
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowHowToPlay(true)}
              aria-label="How to play"
            >
              <HelpCircle className="h-5 w-5" />
            </Button>
            {gameStatus !== 'playing' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleShare}
                aria-label="Share results"
              >
                <Share2 className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-8">
          {/* Game Status */}
          <div className="text-center">
            <h1 className="text-xl font-semibold mb-2">
              Puzzle #{puzzle.id.split('_')[1]}
            </h1>
            <p className="text-sm text-muted-foreground">
              Decode the {puzzle.length}-letter word through spectral feedback
            </p>
          </div>

          {/* Guess Grid */}
          <div className="space-y-2">
            {/* Previous guesses */}
            {guesses.map((guess, rowIndex) => {
              const guessWord = puzzle.target.split('').map((_, i) => {
                // Reconstruct the guess word from tiles
                return String.fromCharCode(65 + Math.round((guess.tiles[i].h / 360) * 26));
              }).join('');
              
              return (
                <div key={rowIndex} className="space-y-2">
                  <div className="flex justify-center gap-1">
                    {guess.tiles.map((tile, i) => {
                      // Get the actual guessed letter by working backwards from the scoring
                      const letter = rowIndex < guesses.length ? 
                        (puzzle.target[i] || '?') : '?';
                      
                      return (
                        <ChromaTile
                          key={i}
                          letter={letter}
                          color={tile}
                          meta={guess.tileMeta[i]}
                          state="submitted"
                          showSymbol={showSymbols}
                        />
                      );
                    })}
                  </div>
                  <SimilarityMeter similarity={guess.similarity} />
                </div>
              );
            })}

            {/* Current guess row */}
            {gameStatus === 'playing' && guesses.length < puzzle.maxGuesses && (
              <div className="flex justify-center gap-1">
                {Array.from({ length: puzzle.length }).map((_, i) => (
                  <ChromaTile
                    key={i}
                    letter={currentGuess[i] || ''}
                    state={currentGuess[i] ? 'filled' : 'empty'}
                  />
                ))}
              </div>
            )}

            {/* Empty rows */}
            {Array.from({ length: Math.max(0, puzzle.maxGuesses - guesses.length - (gameStatus === 'playing' ? 1 : 0)) }).map((_, i) => (
              <div key={`empty-${i}`} className="flex justify-center gap-1">
                {Array.from({ length: puzzle.length }).map((_, j) => (
                  <ChromaTile key={j} letter="" state="empty" />
                ))}
              </div>
            ))}
          </div>

          {/* Game Status Messages */}
          {gameStatus === 'won' && (
            <div className="text-center p-4 bg-green-500/10 border border-green-500 rounded-lg">
              <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                🎉 Congratulations! You solved it in {guesses.length} {guesses.length === 1 ? 'guess' : 'guesses'}!
              </p>
            </div>
          )}

          {gameStatus === 'lost' && (
            <div className="text-center p-4 bg-red-500/10 border border-red-500 rounded-lg">
              <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                The word was: <span className="font-mono">{puzzle.target}</span>
              </p>
            </div>
          )}

          {/* Controls */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSymbols(!showSymbols)}
            >
              <Eye className="h-4 w-4 mr-2" />
              {showSymbols ? 'Hide' : 'Show'} Symbols
            </Button>
          </div>

          {/* Keyboard */}
          <ChromaKeyboard
            onKeyPress={handleKeyPress}
            onBackspace={handleBackspace}
            onEnter={handleSubmitGuess}
            disabled={gameStatus !== 'playing'}
          />
        </div>
      </main>

      {/* How to Play Dialog */}
      <Dialog open={showHowToPlay} onOpenChange={setShowHowToPlay}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">How to Play Chromaword</DialogTitle>
            <DialogDescription>
              Decode the word using spectral color feedback
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4 text-sm">
            <section>
              <h3 className="font-semibold text-base mb-2">🎯 Objective</h3>
              <p className="text-muted-foreground">
                Guess the {puzzle.length}-letter word in {puzzle.maxGuesses} tries or less. Each guess reveals spectral color feedback to guide you to the solution.
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
                Each guess shows a spectrum alignment percentage (0-100%). Higher percentages mean you're closer to the target word. Use this to gauge your overall progress!
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">♿ Accessibility Symbols</h3>
              <p className="text-muted-foreground mb-2">
                Toggle symbols for color-blind safe feedback:
              </p>
              <div className="space-y-2 bg-card p-3 rounded border border-border">
                <div className="flex items-center gap-2">
                  <span className="font-mono">✓</span>
                  <span className="text-xs text-muted-foreground">Correct letter in correct position</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono">◎</span>
                  <span className="text-xs text-muted-foreground">Letter in word but wrong position</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono">✗</span>
                  <span className="text-xs text-muted-foreground">Letter not in word</span>
                </div>
              </div>
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
