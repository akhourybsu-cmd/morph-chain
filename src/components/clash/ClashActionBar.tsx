import { useClashStore } from '@/stores/clashStore';
import { Button } from '@/components/ui/button';
import { Loader2, Send, RotateCcw, Flag, SkipForward } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

interface ClashActionBarProps {
  isMyTurn: boolean;
}

export const ClashActionBar = ({ isMyTurn }: ClashActionBarProps) => {
  const { selected, match, submitMove, skipTurn, clearSelection, forfeit, loading, error } = useClashStore();
  const [confirming, setConfirming] = useState(false);
  const [skipping, setSkipping] = useState(false);

  if (!match || match.status !== 'active') return null;

  const word = match.grid_state && selected.length > 0
    ? selected.map(s => match.grid_state[s.row][s.col].char).join('')
    : '';

  const canSubmit = isMyTurn && selected.length >= 4;

  const handleSubmit = async () => {
    const success = await submitMove();
    if (success) {
      toast.success(`"${word}" claimed!`);
    } else if (error) {
      toast.error(error);
    }
  };

  const handleSkip = async () => {
    setSkipping(true);
    const success = await skipTurn();
    setSkipping(false);
    if (success) {
      toast('Turn skipped (−1 move)');
    }
  };

  const handleForfeit = () => {
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3000);
      return;
    }
    forfeit();
    setConfirming(false);
  };

  return (
    <div className="flex items-center justify-center gap-3 flex-wrap">
      {selected.length > 0 && (
        <Button
          variant="ghost" size="sm"
          onClick={clearSelection}
          className="text-[hsl(var(--clash-text-muted))]"
        >
          <RotateCcw className="w-4 h-4 mr-1" />
          Clear
        </Button>
      )}

      <Button
        onClick={handleSubmit}
        disabled={!canSubmit || loading}
        size="default"
        className="px-6 font-inter font-semibold"
        style={{
          background: canSubmit ? 'hsl(var(--clash-accent))' : 'hsl(var(--clash-pill-bg))',
          color: canSubmit ? '#fff' : 'hsl(var(--clash-text-muted))',
        }}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Send className="w-4 h-4 mr-1" />}
        Submit
      </Button>

      {isMyTurn && selected.length === 0 && (
        <Button
          variant="ghost" size="sm"
          onClick={handleSkip}
          disabled={skipping || loading}
          className="text-[hsl(var(--clash-text-muted))]"
        >
          {skipping ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <SkipForward className="w-3 h-3 mr-1" />}
          Skip
        </Button>
      )}

      <Button
        variant="ghost" size="sm"
        onClick={handleForfeit}
        className={confirming ? 'text-[hsl(var(--clash-error))]' : 'text-[hsl(var(--clash-text-muted))]'}
      >
        <Flag className="w-3 h-3 mr-1" />
        {confirming ? 'Confirm?' : 'Forfeit'}
      </Button>
    </div>
  );
};
