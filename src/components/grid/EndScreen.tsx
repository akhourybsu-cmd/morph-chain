import { useGridStore } from '@/stores/gridStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface EndScreenProps {
  open: boolean;
  onClose: () => void;
}

export const EndScreen = ({ open, onClose }: EndScreenProps) => {
  const { moves, submittedWords, dailySeed, morphCount, stabilizationCount } = useGridStore();
  
  const longestWord = submittedWords.reduce((longest, current) => 
    current.word.length > longest.length ? current.word : longest
  , '');
  
  const handleShare = () => {
    const text = `💎 MORPH GRID — Daily ${dailySeed}
🏆 Completed in ${moves} moves
📝 ${submittedWords.length} words | Longest: "${longestWord}"
🔄 ${morphCount} morphs | 🔒 ${stabilizationCount} stabilized

morphgames.io`;
    
    navigator.clipboard.writeText(text);
    toast.success('Results copied to clipboard!');
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md relative overflow-hidden">
        {/* Purple ambient glow background */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/20 via-purple-600/10 to-transparent pointer-events-none animate-pulse-glow" />
        
        <DialogHeader className="relative z-10">
          <DialogTitle className="text-3xl font-outfit font-bold text-center bg-gradient-to-r from-purple-400 via-purple-300 to-purple-400 bg-clip-text text-transparent animate-shimmer">
            All Purple!
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4 relative z-10">
          {/* Moves Display */}
          <div className="text-center">
            <div className="text-6xl font-outfit font-bold bg-gradient-to-br from-purple-400 to-purple-600 bg-clip-text text-transparent mb-2 drop-shadow-[0_0_20px_rgba(168,85,247,0.4)]">
              {moves}
            </div>
            <div className="text-muted-foreground">Moves Used</div>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-card/50 rounded-lg border border-border/50">
              <div className="text-2xl font-bold">{submittedWords.length}</div>
              <div className="text-xs text-muted-foreground">Words Formed</div>
            </div>
            
            <div className="text-center p-4 bg-card/50 rounded-lg border border-border/50">
              <div className="text-2xl font-bold">{longestWord.length}</div>
              <div className="text-xs text-muted-foreground">Longest Word</div>
            </div>
            
            <div className="text-center p-4 bg-card/50 rounded-lg border border-border/50">
              <div className="text-2xl font-bold">{morphCount}</div>
              <div className="text-xs text-muted-foreground">Morphs</div>
            </div>
            
            <div className="text-center p-4 bg-card/50 rounded-lg border border-border/50">
              <div className="text-2xl font-bold">{stabilizationCount}</div>
              <div className="text-xs text-muted-foreground">Stabilized</div>
            </div>
          </div>
          
          {/* Longest Word Highlight */}
          {longestWord && (
            <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/30">
              <div className="text-sm text-muted-foreground mb-1">Longest Word</div>
              <div className="text-3xl font-outfit font-bold text-primary">
                {longestWord.toUpperCase()}
              </div>
            </div>
          )}
          
          {/* Word List */}
          <div className="max-h-48 overflow-y-auto space-y-2 p-3 bg-card/30 rounded-lg border border-border/30">
            <div className="text-sm font-semibold text-muted-foreground mb-2">All Words:</div>
            <div className="flex flex-wrap gap-2">
              {submittedWords.map((w, i) => (
                <div
                  key={i}
                  className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium"
                >
                  {w.word}
                </div>
              ))}
            </div>
          </div>
          
          {/* Share Button */}
          <Button
            onClick={handleShare}
            className="w-full"
            size="lg"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share Results
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
