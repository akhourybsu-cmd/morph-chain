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
            <p>Score as many points as possible in 2 minutes by morphing words! Change one letter at a time to create new valid words.</p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">⚡ Scoring System</h3>
            <ul className="space-y-2 ml-4">
              <li><strong>Base Score:</strong> 100 points per word</li>
              <li><strong>Rarity Bonus:</strong> +25 for J, Q, X, Z • +10 for K, V, W, Y</li>
              <li><strong>Branch Bonus:</strong> +20 if word has 6+ unused neighbors</li>
              <li><strong>Flow Multiplier:</strong> Chain words quickly! Increases by 0.1x per word (max 3.0x), resets after 5 seconds</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">🎮 Game Modes</h3>
            <ul className="space-y-2 ml-4">
              <li><strong>Daily:</strong> Compete on the global leaderboard with the day's starting word</li>
              <li><strong>Practice:</strong> Unlimited tries with no timer or leaderboard</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-3">💡 Power-ups (One per game)</h3>
            <div className="space-y-2 ml-4">
              <div className="flex items-start gap-2">
                <Eye className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Scout:</strong> Reveals a valid neighbor word
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Undo2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Undo:</strong> Remove your last word and restore points
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-3">🏆 End-of-Run Bonuses</h3>
            <div className="space-y-2 ml-4">
              <div className="flex items-start gap-2">
                <Trophy className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Clean Run:</strong> +100 points for zero invalid submissions
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Award className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>Explorer:</strong> +1% per unique starting letter used
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">⚙️ Hard Mode</h3>
            <p>Can't change the same letter position twice in a row! Set before your first move.</p>
          </section>

          <section>
            <h3 className="font-semibold text-base mb-2">💡 Pro Tips</h3>
            <ul className="space-y-1 ml-4 list-disc">
              <li>Keep your multiplier high by morphing quickly (under 5 seconds)</li>
              <li>Use rare letters (Q, X, Z) for bonus points</li>
              <li>Look for words with many neighbors to get branch bonuses</li>
              <li>Save power-ups for when you're stuck</li>
            </ul>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
};
