import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { HelpCircle, MessageSquare, FlaskConical } from "lucide-react";
import { PrismLogo } from "@/components/PrismLogo";
import { ColorSwatch } from "@/components/prism/ColorSwatch";
import { ChannelControl } from "@/components/prism/ChannelControl";
import { GameHUD } from "@/components/prism/GameHUD";
import { PrismFeedbackModal } from "@/components/prism/PrismFeedbackModal";
import {
  Channel,
  ColorState,
  getNextChannelValue,
  isCloserToGoal,
  colorsEqual,
} from "@/lib/prismColorGrid";
import { getTodaysPuzzle } from "@/lib/prismPuzzleGenerator";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function MorphPrism() {
  const navigate = useNavigate();
  const [puzzle] = useState(() => getTodaysPuzzle());
  const [currentColor, setCurrentColor] = useState<ColorState>(puzzle.start);
  const [moves, setMoves] = useState<ColorState[]>([puzzle.start]);
  const [hintsRemaining, setHintsRemaining] = useState(puzzle.hints);
  const [lastMoveStatus, setLastMoveStatus] = useState<'closer' | 'sideways' | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showSolutionNumbers, setShowSolutionNumbers] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  
  const gameWon = colorsEqual(currentColor, puzzle.goal);
  const gameLost = moves.length > puzzle.cap && !gameWon;
  const movesUsed = moves.length - 1; // Don't count starting position
  
  const handleMove = (channel: Channel, direction: '+' | '-') => {
    if (gameWon || gameLost) return;
    
    const newValue = getNextChannelValue(channel, currentColor[channel], direction);
    if (newValue === null) return;
    
    const newColor: ColorState = { ...currentColor, [channel]: newValue };
    
    // Check if closer or sideways
    const closer = isCloserToGoal(currentColor, newColor, puzzle.goal);
    setLastMoveStatus(closer ? 'closer' : 'sideways');
    
    setCurrentColor(newColor);
    setMoves(prev => [...prev, newColor]);
    
    // Check win condition
    if (colorsEqual(newColor, puzzle.goal)) {
      toast.success(`🎉 Solved in ${moves.length} moves!`);
    } else if (moves.length >= puzzle.cap) {
      toast.error("Out of moves! Try again tomorrow.");
    }
  };
  
  const handleHint = () => {
    if (hintsRemaining === 0) return;
    
    // Simple hint: suggest a channel that gets closer
    const channels: Channel[] = ['H', 'S', 'L'];
    
    for (const channel of channels) {
      const directions: ('+' | '-')[] = ['+', '-'];
      
      for (const direction of directions) {
        const newValue = getNextChannelValue(channel, currentColor[channel], direction);
        if (newValue === null) continue;
        
        const testColor: ColorState = { ...currentColor, [channel]: newValue };
        if (isCloserToGoal(currentColor, testColor, puzzle.goal)) {
          setHintsRemaining(prev => prev - 1);
          const channelName = channel === 'H' ? 'Hue' : channel === 'S' ? 'Saturation' : 'Lightness';
          const directionText = direction === '+' ? 'increase' : 'decrease';
          toast.info(`💡 Try to ${directionText} ${channelName}!`);
          return;
        }
      }
    }
    
    toast.info("💡 Any valid move works from here!");
    setHintsRemaining(prev => prev - 1);
  };
  
  const handleShare = () => {
    const status = gameWon ? '✅' : '❌';
    const text = `Morph Prism #${puzzle.puzzleNumber}\n${status} ${movesUsed}/${puzzle.cap} moves\n\nPlay at: ${window.location.origin}/prism`;
    
    if (navigator.share) {
      navigator.share({ text });
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="h-14 grid grid-cols-3 items-center px-4 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-1 justify-start">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowFeedback(true)}
            aria-label="Send feedback"
            className="hover:bg-muted/50 h-9 w-9"
          >
            <MessageSquare className="h-5 w-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowHelp(true)}
            aria-label="How to play"
            className="hover:bg-muted/50 h-9 w-9"
          >
            <HelpCircle className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="flex justify-center">
          <PrismLogo />
        </div>
        
        <div className="flex items-center gap-1 justify-end">
          {/* Empty right side to maintain grid balance */}
        </div>
      </header>
      
      <main className="container max-w-2xl mx-auto p-4 space-y-6">
        {/* Test Build Notice */}
        <div className="flex items-center gap-2 p-3 bg-accent/10 border border-accent/20 rounded-lg text-sm">
          <FlaskConical className="h-4 w-4 text-accent flex-shrink-0" />
          <p className="text-muted-foreground">
            <span className="font-semibold text-foreground">Test Build:</span> Morph Prism is in active development. 
            <button 
              onClick={() => setShowFeedback(true)}
              className="ml-1 underline hover:text-foreground transition-colors"
            >
              Share your feedback
            </button>
          </p>
        </div>

        {/* Color Swatches */}
        <div className="flex items-center justify-between gap-4">
          <ColorSwatch
            color={puzzle.start}
            label="Start"
            size="small"
            showValues={showSolutionNumbers}
          />
          
          <ColorSwatch
            color={currentColor}
            label="Current"
            size="large"
            showValues={false}
          />
          
          <ColorSwatch
            color={puzzle.goal}
            label="Goal"
            size="small"
            showValues={showSolutionNumbers}
          />
        </div>
        
        {/* Game Status */}
        {gameWon && (
          <div className="text-center p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
            <p className="text-lg font-bold text-green-700 dark:text-green-300">
              🎉 Puzzle Solved!
            </p>
            <p className="text-sm text-muted-foreground">
              Completed in {movesUsed} moves
            </p>
          </div>
        )}
        
        {gameLost && (
          <div className="text-center p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-lg font-bold text-red-700 dark:text-red-300">
              Out of moves!
            </p>
            <p className="text-sm text-muted-foreground">
              Try again tomorrow
            </p>
          </div>
        )}
        
        {/* HUD */}
        <GameHUD
          movesUsed={movesUsed}
          moveCap={puzzle.cap}
          hintsRemaining={hintsRemaining}
          lastMoveStatus={lastMoveStatus}
          onHint={handleHint}
          onShare={handleShare}
          gameWon={gameWon}
          gameLost={gameLost}
        />
        
        {/* Controls */}
        <div className="space-y-3">
          <ChannelControl
            channel="H"
            color={currentColor}
            onMove={handleMove}
            disabled={gameWon || gameLost}
            showValue={true}
          />
          <ChannelControl
            channel="S"
            color={currentColor}
            onMove={handleMove}
            disabled={gameWon || gameLost}
            showValue={true}
          />
          <ChannelControl
            channel="L"
            color={currentColor}
            onMove={handleMove}
            disabled={gameWon || gameLost}
            showValue={true}
          />
        </div>
        
        {/* Show Numbers Button - appears when game ends */}
        {(gameWon || gameLost) && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSolutionNumbers(!showSolutionNumbers)}
            >
              {showSolutionNumbers ? 'Hide' : 'Show'} Numbers
            </Button>
          </div>
        )}
      </main>
      
      {/* How to Play Dialog */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">How to Play Morph Prism</DialogTitle>
            <DialogDescription>
              Transform the start color into the goal color by adjusting HSL channels
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4 text-sm">
            <section>
              <h3 className="font-semibold text-base mb-2">🎯 Objective</h3>
              <p className="text-muted-foreground mb-2">
                Your goal is to transform the START color swatch into the GOAL color swatch by making a series of careful adjustments to the color's HSL (Hue, Saturation, Lightness) values.
              </p>
              <p className="text-muted-foreground text-sm">
                Each adjustment brings you closer to the target color, but you must stay within the move limit!
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">🎨 Understanding HSL</h3>
              <div className="space-y-3 bg-card p-3 rounded border border-border">
                <div>
                  <p className="font-medium text-sm">Hue (0° - 345°)</p>
                  <p className="text-xs text-muted-foreground">
                    The color itself on the color wheel. 0° = Red, 120° = Green, 240° = Blue. Adjustments: ±15° per move. <strong>Wraps around:</strong> 345° + 15° = 0° (back to red).
                  </p>
                </div>
                <div>
                  <p className="font-medium text-sm">Saturation (0% - 100%)</p>
                  <p className="text-xs text-muted-foreground">
                    Color intensity. 0% = completely gray (no color), 100% = fully vibrant. Adjustments: ±10% per move.
                  </p>
                </div>
                <div>
                  <p className="font-medium text-sm">Lightness (0% - 100%)</p>
                  <p className="text-xs text-muted-foreground">
                    Brightness level. 0% = pure black, 50% = true color, 100% = pure white. Adjustments: ±10% per move.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">📏 Core Rules</h3>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start gap-2 text-muted-foreground">
                  <span className="text-primary">•</span>
                  <span><strong>One Channel Per Move:</strong> You can only adjust ONE of the three channels (H, S, or L) on each turn. Choose wisely!</span>
                </li>
                <li className="flex items-start gap-2 text-muted-foreground">
                  <span className="text-primary">•</span>
                  <span><strong>Fixed Adjustments:</strong> Hue changes by ±15°, Saturation and Lightness change by ±10% each move. You can't make smaller or larger adjustments.</span>
                </li>
                <li className="flex items-start gap-2 text-muted-foreground">
                  <span className="text-primary">•</span>
                  <span><strong>Move Limit:</strong> You have {puzzle.cap} moves to reach the goal. Plan your path carefully—some puzzles require thinking several steps ahead!</span>
                </li>
                <li className="flex items-start gap-2 text-muted-foreground">
                  <span className="text-primary">•</span>
                  <span><strong>Hue Wrapping:</strong> The hue wheel wraps around at 0°/345°. Going from 345° up brings you to 0° (red), and going from 0° down takes you to 345°.</span>
                </li>
              </ul>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">🎯 Distance Feedback</h3>
              <p className="text-muted-foreground mb-2">After each move, you'll see feedback indicating your progress:</p>
              <div className="space-y-2 bg-card p-3 rounded border border-border">
                <div className="flex items-start gap-2">
                  <div className="px-2 py-1 bg-success/10 text-success rounded text-xs font-medium whitespace-nowrap">
                    ✓ Closer
                  </div>
                  <span className="text-xs text-muted-foreground">Your move decreased the total color distance to the goal. You're on the right track!</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="px-2 py-1 bg-warning/10 text-warning rounded text-xs font-medium whitespace-nowrap">
                    ↔ Sideways
                  </div>
                  <span className="text-xs text-muted-foreground">The distance stayed the same. Sometimes necessary to position yourself for the next move, but be careful not to waste moves.</span>
                </div>
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">💡 Hints</h3>
              <div className="bg-card p-3 rounded border border-border">
                <p className="text-sm text-muted-foreground mb-2">
                  You have <strong>{puzzle.hints} hint(s)</strong> available for this puzzle.
                </p>
                <p className="text-xs text-muted-foreground">
                  Using a hint will reveal which channel (H, S, or L) and direction (+/-) to adjust next. Use hints strategically when you're stuck or need confirmation of your planned path.
                </p>
              </div>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">🏆 Winning</h3>
              <p className="text-muted-foreground">
                Successfully match the GOAL color exactly within the allowed number of moves. The current color display will show a checkmark (✓) when you've achieved an exact match!
              </p>
            </section>

            <section>
              <h3 className="font-semibold text-base mb-2">💡 Strategy Tips</h3>
              <ul className="space-y-2 ml-4 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Compare the START and GOAL color values carefully before making your first move</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Calculate the number of moves needed for each channel (divide the difference by 15 for Hue, by 10 for S and L)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Watch out for hue wrapping—sometimes the shorter path is to go "backwards" around the wheel</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>Don't waste moves on channels that are already at the goal value</span>
                </li>
              </ul>
            </section>
          </div>
        </DialogContent>
      </Dialog>

      {/* Feedback Dialog */}
      <PrismFeedbackModal open={showFeedback} onOpenChange={setShowFeedback} />
    </div>
  );
}
