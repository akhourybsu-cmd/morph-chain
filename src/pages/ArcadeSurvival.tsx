import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MorphArcadeTitle } from "@/components/GameTitles";
import { Menu, Share2 } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { getDailyArcadePuzzle } from "@/lib/arcadePuzzles";
import { isValidWord, getHints } from "@/lib/gameLogic";
import { supabase } from "@/integrations/supabase/client";
import { formatInTimeZone } from "date-fns-tz";
import { toast } from "sonner";
import { ArcadeLeaderboard } from "@/components/arcade/ArcadeLeaderboard";
import { ArcadeMenuSheet } from "@/components/arcade/ArcadeMenuSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HintTile, TileState } from "@/components/HintTile";

/**
 * MORPH CHAIN — ARCADE (Morph Mystery Mode)
 * - Transform a starting word into a hidden goal word
 * - Change one letter at a time to form valid words
 * - Goal: Discover the hidden word in as few moves as possible
 * - No timer, no repeats allowed
 */

type GameState = "idle" | "playing" | "won";

/* ----------------------------- Header & Menu ----------------------------- */

function ArcadeHeader({
  onOpenMenu,
  onOpenHelp,
}: {
  onOpenMenu: () => void;
  onOpenHelp: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur border-b border-slate-800">
      <div className="max-w-screen-sm mx-auto px-4 h-14 flex items-center justify-between">
        <button
          aria-label="Open menu"
          onClick={onOpenMenu}
          className="p-2 rounded-md text-slate-300 hover:bg-slate-800"
        >
          <Menu className="w-5 h-5" />
        </button>

        <a href="/" className="flex-1 flex justify-center">
          <MorphArcadeTitle className="text-base sm:text-lg" />
        </a>

        <div className="flex items-center gap-1">
          <button
            onClick={onOpenHelp}
            className="p-2 rounded-md text-slate-300 hover:bg-slate-800"
            aria-label="How to Play"
            title="How to Play"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <circle cx="12" cy="17" r="0.5" fill="currentColor"/>
            </svg>
          </button>
          <a
            href="/login"
            className="p-2 rounded-md text-slate-300 hover:bg-slate-800"
            aria-label="Log in"
            title="Log in"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
              <polyline points="10 17 15 12 10 7"/>
              <line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
          </a>
        </div>
      </div>
    </header>
  );
}


function HowToPlayModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-slate-900 rounded-xl p-6 ring-1 ring-slate-700 shadow-2xl">
        <div className="text-2xl font-bold text-slate-100 mb-4 text-center">
          <MorphArcadeTitle className="text-xl" />
        </div>
        
        <div className="text-slate-300 text-sm space-y-4 max-h-[70vh] overflow-auto pr-2">
          <section>
            <h3 className="text-lg font-bold text-cyan-400 mb-2">🎯 Objective</h3>
            <p>Transform the starting word into a <b className="text-cyan-300">hidden goal word</b> by changing one letter at a time. The goal word is secret — you'll only discover it when you reach it!</p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-cyan-400 mb-2">📜 Rules</h3>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Change <b>exactly one letter</b> per move to create a new valid word</li>
              <li>All words must be valid 5-letter U.S. English dictionary words</li>
              <li><b>No repeating words</b> — each word can only be used once per puzzle</li>
              <li>The goal is to find the hidden word in <b>as few moves as possible</b></li>
              <li>No timer — take your time to think strategically!</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-bold text-cyan-400 mb-2">🏆 Scoring & Leaderboard</h3>
            <p className="mb-2">Each day features a new puzzle with a unique hidden goal word.</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><b>Fewer moves = better score</b></li>
              <li>Compete on the daily leaderboard</li>
              <li>If two players tie, the first to solve wins</li>
              <li>Share your results with friends!</li>
            </ul>
          </section>

          <section className="bg-cyan-900/20 p-3 rounded border border-cyan-700/30">
            <h3 className="text-sm font-bold text-cyan-300 mb-1">💎 Pro Tips</h3>
            <ul className="text-xs space-y-1 text-slate-300">
              <li>• Think ahead — plan your word chain strategically</li>
              <li>• Look for common letter patterns and word families</li>
              <li>• Sometimes the shortest path isn't obvious!</li>
              <li>• Practice improves your word intuition</li>
            </ul>
          </section>
        </div>

        <div className="mt-5 flex justify-center">
          <button onClick={onClose} className="px-6 py-2.5 rounded-lg bg-cyan-400 text-slate-900 font-bold text-base hover:bg-cyan-300 transition">
            Start Solving! 🎮
          </button>
        </div>
      </div>
    </div>
  );
}

function HiddenWordDisplay({ goalWord }: { goalWord: string }) {
  return (
    <div className="text-center mb-6">
      <div className="text-xs text-slate-400 mb-2">🗝️ Hidden Word — Unknown</div>
      <div className="flex justify-center gap-1">
        {goalWord.split('').map((_, i) => (
          <div key={i} className="w-12 h-14 bg-slate-800/50 rounded border-2 border-cyan-500/30 animate-pulse" />
        ))}
      </div>
    </div>
  );
}

function WordChainDisplay({ words, goalWord }: { words: string[]; goalWord: string }) {
  if (words.length === 0) return null;
  
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-xs text-slate-400 mb-2">Your Chain:</div>
      <div className="space-y-2 max-h-64 overflow-y-auto bg-slate-800/30 rounded-lg p-3 border border-slate-700/50">
        {words.map((word, i) => {
          const hints = getHints(word.toUpperCase(), goalWord.toUpperCase());
          return (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs text-slate-500 w-6">{i + 1}.</span>
              <div className="flex gap-1">
                {word.split('').map((letter, j) => (
                  <HintTile
                    key={j}
                    letter={letter}
                    state={hints[j]}
                    delay={0}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VictoryModal({ 
  open, 
  onClose, 
  moves, 
  goalWord,
  wordChain
}: { 
  open: boolean; 
  onClose: () => void;
  moves: number;
  goalWord: string;
  wordChain: string[];
}) {
  if (!open) return null;

  const handleShare = async () => {
    const shareText = `Morph Chain Arcade — Solved in ${moves} moves!\n🔠 ${wordChain[0]} → ... → ${goalWord}\nmorphchaingame.com`;
    
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText });
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      toast.success("Copied to clipboard!");
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/70" />
      <div className="relative w-full max-w-md bg-slate-900 rounded-xl p-6 ring-1 ring-slate-700 shadow-2xl">
        <div className="text-center space-y-4">
          <div className="text-4xl mb-2">🎉</div>
          <h2 className="text-2xl font-bold text-cyan-400">You found it!</h2>
          <div className="text-3xl font-bold text-slate-100">{goalWord.toUpperCase()}</div>
          <p className="text-slate-300">
            Solved in <span className="text-cyan-400 font-bold">{moves}</span> moves
          </p>
          
          <div className="pt-4 space-y-2">
            <Button 
              onClick={handleShare} 
              className="w-full bg-cyan-400 text-slate-900 hover:bg-cyan-300"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share Results
            </Button>
            <Button 
              onClick={onClose} 
              variant="outline"
              className="w-full"
            >
              View Leaderboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ArcadeSurvivalPage() {
  const navigate = useNavigate();
  const { hasBetaAccess, loading } = useUserRole();
  
  const [menuOpen, setMenuOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [firstTime, setFirstTime] = useState(true);

  const [state, setState] = useState<GameState>("idle");
  const [puzzle, setPuzzle] = useState(getDailyArcadePuzzle());
  const [currentWord, setCurrentWord] = useState("");
  const [wordChain, setWordChain] = useState<string[]>([]);
  const [usedWords, setUsedWords] = useState<Set<string>>(new Set());
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState("");
  const [victoryOpen, setVictoryOpen] = useState(false);
  
  // Redirect if user doesn't have beta access
  useEffect(() => {
    if (!loading && !hasBetaAccess) {
      navigate("/");
    }
  }, [loading, hasBetaAccess, navigate]);

  // Initialize puzzle
  useEffect(() => {
    const dailyPuzzle = getDailyArcadePuzzle();
    setPuzzle(dailyPuzzle);
    setCurrentWord(dailyPuzzle.startWord);
    setWordChain([dailyPuzzle.startWord]);
    setUsedWords(new Set([dailyPuzzle.startWord.toUpperCase()]));
  }, []);

  const startGame = () => {
    if (firstTime) {
      setHelpOpen(true);
      setFirstTime(false);
    }
    setState("playing");
  };

  const handleSubmit = async () => {
    if (!inputValue || state !== "playing") return;

    const word = inputValue.trim().toUpperCase();
    
    // Validate word length
    if (word.length !== 5) {
      setError("Must be a 5-letter word");
      return;
    }

    // Check if word was already used
    if (usedWords.has(word)) {
      setError("Word already used in this chain");
      return;
    }

    // Check if exactly one letter changed
    const currentUpper = currentWord.toUpperCase();
    let diffCount = 0;
    for (let i = 0; i < 5; i++) {
      if (word[i] !== currentUpper[i]) diffCount++;
    }
    
    if (diffCount !== 1) {
      setError("Change exactly ONE letter");
      return;
    }

    // Validate word in dictionary
    const valid = isValidWord(word, 5);
    if (!valid) {
      setError("Not a valid word");
      return;
    }

    // Clear error
    setError("");

    // Update game state
    const newChain = [...wordChain, word];
    setWordChain(newChain);
    setUsedWords(new Set([...usedWords, word]));
    setCurrentWord(word);
    setInputValue("");

    // Check if goal reached
    if (word === puzzle.goalWord.toUpperCase()) {
      setState("won");
      setVictoryOpen(true);
      
      // Save completion to database
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.warn('Cannot save completion: User not authenticated');
          return;
        }
        
        const tz = 'America/New_York';
        const dateISO = formatInTimeZone(new Date(), tz, 'yyyy-MM-dd');
        
        await supabase.from('arcade_completions').insert({
          user_id: user.id,
          date_local: dateISO,
          moves: newChain.length - 1, // Subtract 1 because starting word doesn't count as a move
          word_chain: newChain,
          session_id: `session_${Date.now()}`,
        });
      } catch (err) {
        console.error('Failed to save completion:', err);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase();
    if (val === "" || /^[a-z]{0,5}$/.test(val)) {
      setInputValue(val);
      setError("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 grid place-items-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <ArcadeHeader onOpenMenu={() => setMenuOpen(true)} onOpenHelp={() => setHelpOpen(true)} />
      <ArcadeMenuSheet open={menuOpen} onOpenChange={setMenuOpen} />
      <HowToPlayModal open={helpOpen} onClose={() => setHelpOpen(false)} />
      <VictoryModal
        open={victoryOpen} 
        onClose={() => setVictoryOpen(false)}
        moves={wordChain.length - 1}
        goalWord={puzzle.goalWord}
        wordChain={wordChain}
      />

      <main className="max-w-screen-sm mx-auto px-4 py-8 space-y-6">
        {state === "idle" && (
          <div className="text-center space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-cyan-400 mb-2">Morph Mystery</h1>
              <p className="text-slate-400">Transform the word. Discover the hidden goal.</p>
            </div>
            
            <div className="bg-slate-900/50 rounded-lg p-6 space-y-4 border border-slate-800">
              <div>
                <div className="text-sm text-slate-400 mb-3">🗓️ Daily Puzzle #{puzzle.puzzleNumber}</div>
                <div className="text-sm text-slate-400 mb-2">Starting Word:</div>
                <div className="flex justify-center gap-1 mb-4">
                  {puzzle.startWord.split('').map((letter, i) => (
                    <div key={i} className="w-12 h-14 bg-slate-800 rounded border-2 border-slate-700 flex items-center justify-center">
                      <span className="text-2xl font-bold text-slate-100">{letter}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <HiddenWordDisplay goalWord={puzzle.goalWord} />
            </div>

            <Button 
              onClick={startGame}
              size="lg"
              className="bg-cyan-400 text-slate-900 hover:bg-cyan-300 font-bold"
            >
              Start Puzzle
            </Button>
          </div>
        )}

        {state === "playing" && (
          <div className="space-y-6">
            <HiddenWordDisplay goalWord={puzzle.goalWord} />

            <div className="text-center space-y-4">
              <div className="flex justify-between items-center max-w-md mx-auto mb-2">
                <div className="text-sm text-slate-400">
                  Moves: <span className="text-cyan-400 font-bold">{wordChain.length - 1}</span>
                </div>
                <div className="text-xs text-slate-500">
                  🗓️ Puzzle #{puzzle.puzzleNumber}
                </div>
              </div>
              
              <div className="text-xs text-slate-400 mb-2">Current Word:</div>
              {wordChain.length > 0 && (
                <div className="flex justify-center mb-4">
                  <div className="flex gap-1">
                    {currentWord.split('').map((letter, j) => {
                      const hints = getHints(currentWord.toUpperCase(), puzzle.goalWord.toUpperCase());
                      return (
                        <HintTile
                          key={j}
                          letter={letter}
                          state={hints[j]}
                          delay={0}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
              <p className="text-xs text-slate-500">Change one letter to uncover the hidden word</p>
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <Input
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type your next word..."
                className="text-center text-lg uppercase bg-slate-800 border-slate-700 text-slate-100"
                maxLength={5}
                autoFocus
              />
              {error && (
                <div className="text-red-400 text-sm text-center">{error}</div>
              )}
              <Button 
                onClick={handleSubmit}
                className="w-full bg-cyan-400 text-slate-900 hover:bg-cyan-300 font-bold"
                disabled={!inputValue || inputValue.length !== 5}
              >
                Submit Word
              </Button>
            </div>

            {wordChain.length > 1 && (
              <WordChainDisplay words={wordChain} goalWord={puzzle.goalWord} />
            )}
          </div>
        )}

        {state === "won" && (
          <div className="space-y-6">
            <WordChainDisplay words={wordChain} goalWord={puzzle.goalWord} />
            <ArcadeLeaderboard />
          </div>
        )}
      </main>
    </div>
  );
}
