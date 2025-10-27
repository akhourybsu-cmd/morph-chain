import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface HowToPlayModalProps {
  open: boolean;
  onClose: () => void;
}

export const HowToPlayModal = ({ open, onClose }: HowToPlayModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-outfit font-bold">
            How to Play MORPH GRID
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <section>
            <h3 className="font-semibold text-lg mb-2">🎯 Goal</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Form as many valid words as you can on today's 5×5 grid. Everyone sees the same daily board.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-2">🔤 Build Words</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-2">
              Drag or tap to chain letters that touch (8 directions). You can't reuse a tile within the same word.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-2">✅ Submit</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Tap "Submit Word" or swipe the word bar to the right. Words must be 3+ letters and in the dictionary.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-2">🔄 Morphs</h3>
            <p className="text-sm text-muted-foreground mb-2">When you submit a valid word:</p>
            <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
              <li>The <strong>used tiles</strong> morph into new letters</li>
              <li><strong>Neighbors</strong> (N/E/S/W) may mutate (vowel→vowel, consonant→consonant)</li>
              <li>Tiles that mutate twice without being used become <strong>Stabilized</strong> (gray rim) until you use them</li>
              <li>Some tiles appear as <strong>Power</strong> (purple). Use one to morph its entire row</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-2">🏆 Scoring</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Longer words, rare letters (J,Q,X,Z,K,V), morph ripples, and power tiles increase your score.
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground bg-card/30 rounded-lg p-3">
              <div>3 letters: <strong>10 pts</strong></div>
              <div>4 letters: <strong>20 pts</strong></div>
              <div>5 letters: <strong>40 pts</strong></div>
              <div>6 letters: <strong>65 pts</strong></div>
              <div>7+ letters: <strong>95+</strong></div>
              <div>Power bonus: <strong>+20</strong></div>
            </div>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-2">🎮 End</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Play until you're satisfied and tap "End" to see/share your results. A new grid appears each day.
            </p>
          </section>

          <section className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <h3 className="font-semibold text-base mb-2 text-primary">💡 Pro Tips</h3>
            <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
              <li>Try using newly morphed tiles; they tend to open fresh paths</li>
              <li>Free Stabilized tiles to re-enable mutations</li>
              <li>Power tiles are best when they refresh a dead row</li>
            </ul>
          </section>

          <section className="pt-4 border-t">
            <p className="text-center text-sm font-semibold italic text-foreground">
              "Morph the grid. Master the word."
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
};
