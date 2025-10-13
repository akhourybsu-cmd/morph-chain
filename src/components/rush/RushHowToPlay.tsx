import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trophy, Zap, Eye, Undo2, Award } from "lucide-react";

interface RushHowToPlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RushHowToPlay = ({ open, onOpenChange }: RushHowToPlayProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">How to Play Morph Rush</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 text-sm">
          <section>
            <h3 className="font-semibold text-base mb-2">🎯 Objective</h3>
            <p className="mb-2">Score as many points as possible in 2 minutes by creating a chain of 4-letter words. Each word must differ from the previous word by exactly one letter.</p>
            <p className="text-sm text-muted-foreground">
              For example: FIRE → TIRE → TILE → TALE → MALE
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">⚡ Scoring System</h3>
            <div className="space-y-3 ml-4">
              <div>
                <p className="font-medium text-sm">Base Score: 100 points per valid word</p>
                <p className="text-xs text-muted-foreground">Every valid word earns you a base of 100 points</p>
              </div>
              
              <div>
                <p className="font-medium text-sm">Rarity Bonus:</p>
                <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                  <li>+25 points for using J, Q, X, or Z</li>
                  <li>+10 points for using K, V, W, or Y</li>
                  <li className="italic">Example: "QUIZ" gets +50 (Q+Z), "WAXY" gets +20 (W+Y)</li>
                </ul>
              </div>
              
              <div>
                <p className="font-medium text-sm">Branch Bonus: +20 points</p>
                <p className="text-xs text-muted-foreground">Awarded when your word has 6 or more unused one-letter neighbors. This rewards choosing words with many morphing options.</p>
              </div>
              
              <div>
                <p className="font-medium text-sm">Flow Multiplier: 1.0x → 3.0x</p>
                <p className="text-xs text-muted-foreground mb-1">The key to high scores! Your multiplier:</p>
                <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                  <li>Starts at 1.0x</li>
                  <li>Increases by 0.1x for each word submitted within 5 seconds of the previous</li>
                  <li>Caps at 3.0x maximum</li>
                  <li><strong>Resets to 1.0x</strong> if you take longer than 5 seconds between words</li>
                  <li className="italic">Strategy: Speed is crucial! Keep the chain flowing to maximize points.</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">🎮 Game Modes</h3>
            <div className="space-y-2 ml-4">
              <div>
                <p className="font-medium text-sm">Daily Mode (Competitive)</p>
                <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                  <li>Everyone starts with the same 4-letter word each day</li>
                  <li>2-minute timer begins with your first valid word submission</li>
                  <li>Submit your score to the global leaderboard with your initials</li>
                  <li>Separate leaderboards for Normal Mode and Hard Mode</li>
                  <li>Resets daily at midnight Eastern Time</li>
                </ul>
              </div>
              
              <div>
                <p className="font-medium text-sm">Practice Mode (Casual)</p>
                <ul className="text-xs text-muted-foreground space-y-1 ml-4">
                  <li>No timer—play at your own pace</li>
                  <li>Random starting word for each session</li>
                  <li>Perfect for learning strategies and testing word paths</li>
                  <li>Scores don't appear on the leaderboard</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-3">💡 Power-ups</h3>
            <p className="text-sm text-muted-foreground mb-2">Each power-up can only be used <strong>once per game</strong>. Use them strategically!</p>
            <div className="space-y-3 ml-4">
              <div className="flex items-start gap-2 bg-card p-2 rounded border border-border">
                <Eye className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Scout</p>
                  <p className="text-xs text-muted-foreground">Reveals one valid word that's exactly one letter different from your current word. Perfect for when you're stuck and can't think of the next move.</p>
                </div>
              </div>
              <div className="flex items-start gap-2 bg-card p-2 rounded border border-border">
                <Undo2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Undo</p>
                  <p className="text-xs text-muted-foreground">Removes your last submitted word from the chain and refunds its points. The word becomes available to use again. Useful if you realize you took a wrong path.</p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-3">🏆 End-of-Run Bonuses</h3>
            <p className="text-sm text-muted-foreground mb-2">Earn bonus points based on your gameplay quality when time expires:</p>
            <div className="space-y-3 ml-4">
              <div className="flex items-start gap-2 bg-card p-2 rounded border border-border">
                <Trophy className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Clean Run Bonus: +100 points</p>
                  <p className="text-xs text-muted-foreground">Awarded if you made zero invalid word attempts during your run. This rewards accuracy and dictionary knowledge!</p>
                </div>
              </div>
              <div className="flex items-start gap-2 bg-card p-2 rounded border border-border">
                <Award className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Explorer Bonus: +1% per unique starting letter</p>
                  <p className="text-xs text-muted-foreground">Your final score is multiplied by 1% for each different starting letter you used across all words. Example: If you used words starting with F, T, M, A, B (5 letters), you get +5% total score. Encourages vocabulary diversity!</p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">⚙️ Hard Mode</h3>
            <div className="bg-card p-3 rounded border border-border space-y-2">
              <p className="font-medium text-sm">Challenge Rule:</p>
              <p className="text-xs text-muted-foreground">
                You <strong>cannot change the same letter position</strong> on consecutive moves. For example:
              </p>
              <div className="bg-muted/50 p-2 rounded text-xs font-mono space-y-1">
                <div>FIRE → TIRE (changed position 0: F→T) ✓</div>
                <div>TIRE → TAPE (changed position 1: I→A) ✓</div>
                <div>TAPE → TALE (changed position 2: P→L) ✓</div>
                <div className="text-destructive">TALE → TILE (changed position 1: A→I) ❌ Can't change position 2 again!</div>
              </div>
              <p className="text-xs text-muted-foreground italic">
                <strong>Important:</strong> Hard Mode must be enabled <strong>before your first move</strong>. It cannot be toggled mid-game. Separate leaderboard for Hard Mode players!
              </p>
            </div>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">💡 Pro Tips & Strategy</h3>
            <ul className="space-y-2 ml-4 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Speed is Everything:</strong> Keep your flow multiplier active by submitting words every 5 seconds or less. A 3.0x multiplier triples your points!</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Hunt for Rare Letters:</strong> Words with Q, X, Z, J give huge bonuses. "QUIZ" alone is worth 250+ points with a good multiplier.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Branch Out:</strong> Choose words with many one-letter neighbors (6+) to earn the +20 branch bonus consistently.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Save Power-ups:</strong> Use Scout when truly stuck, not just for convenience. Save Undo for correcting costly mistakes late in the run.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Aim for Clean Runs:</strong> The +100 bonus for zero invalid attempts is significant. Double-check words before submitting if unsure.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span><strong>Diversify Starting Letters:</strong> The Explorer bonus rewards using words with different first letters. Don't just cycle between T words and F words!</span>
              </li>
            </ul>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
};
