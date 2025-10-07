import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, HelpCircle, MessageSquare, FlaskConical } from "lucide-react";
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
      <header className="h-14 flex items-center px-4 border-b border-border bg-card/50 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          aria-label="Back to home"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div className="flex-1 flex justify-center">
          <PrismLogo />
        </div>
        
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowFeedback(true)}
            aria-label="Send feedback"
          >
            <MessageSquare className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowHelp(true)}
            aria-label="How to play"
          >
            <HelpCircle className="h-5 w-5" />
          </Button>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>How to Play Morph Prism</DialogTitle>
            <DialogDescription>
              Transform the start color into the goal color
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <h3 className="font-semibold mb-2">Rules:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Change ONE channel per move (Hue, Saturation, or Lightness)</li>
                <li>Hue wraps around the color wheel (0° ↔ 345°)</li>
                <li>Complete the puzzle within {puzzle.cap} moves</li>
                <li>Watch for "Closer" or "Sideways" feedback after each move</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Hints:</h3>
              <p className="text-sm text-muted-foreground">
                You have {puzzle.hints} hint(s) available. Use them wisely to get a nudge in the right direction!
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Feedback Dialog */}
      <PrismFeedbackModal open={showFeedback} onOpenChange={setShowFeedback} />
    </div>
  );
}
