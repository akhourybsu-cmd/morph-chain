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
              Turn every tile <strong>Purple</strong>. The whole board starts <strong>Orange</strong>. Use words to advance colors <strong>Orange → Blue → Purple</strong>. Fewest <strong>moves</strong> wins.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-2">🔤 Build words</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Drag or tap to chain letters that <strong>touch</strong> (diagonals allowed). Words must be <strong>3+ letters</strong> and in the dictionary. You can't reuse a tile within the same word.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-2">🎨 Advance colors</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-2">
              When you submit a valid word, <strong>each tile you used advances one step</strong>:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
              <li><strong>Orange → Blue</strong>, <strong>Blue → Purple</strong>, <strong>Purple stays Purple</strong>.</li>
              <li>Purple tiles can be reused as much as you like.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-2">🔄 Morph the board</h3>
            <p className="text-sm text-muted-foreground mb-2">Every valid word <strong>morphs letters</strong> to keep the grid fresh:</p>
            <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
              <li>Used tiles become <strong>new letters</strong></li>
              <li><strong>Neighbors (N/E/S/W)</strong> might mutate (vowel→vowel, consonant→consonant)</li>
              <li>Tiles mutated twice without being used become <strong>Stabilized</strong> (gray rim) until you use them</li>
              <li><strong>Power tiles</strong> sometimes appear. Use one to <strong>morph its entire row</strong></li>
            </ul>
          </section>

          <section>
            <h3 className="font-semibold text-lg mb-2">🏆 Win & Leaderboard</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              When <strong>all tiles are Purple</strong>, you win! Your result is measured in <strong>Moves</strong> (submissions). Lower is better. Share your result and compare on the leaderboard.
            </p>
          </section>

          <section className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <h3 className="font-semibold text-base mb-2 text-primary">💡 Tips & Fairness</h3>
            <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
              <li>Target clusters of Orange/Blue to advance many tiles per move</li>
              <li>Reuse Purple tiles to reach stubborn Orange corners</li>
              <li>Free Stabilized tiles by using them in a word</li>
              <li className="pt-2 border-t border-primary/20 mt-2">Today's board uses a <strong>balanced letter generator</strong> so every grid is fair and word-friendly. During play, morphs subtly keep vowels and consonants in a healthy mix.</li>
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
