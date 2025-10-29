import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { submitGridScore } from '@/integrations/supabase/gridLeaderboard';

interface GridInitialsInputProps {
  open: boolean;
  onClose: () => void;
  onSubmitted: () => void;
  moves: number;
  wordsUsed: number;
  timeToCompleteMs?: number;
  dateSeed: string;
}

export const GridInitialsInput = ({
  open,
  onClose,
  onSubmitted,
  moves,
  wordsUsed,
  timeToCompleteMs,
  dateSeed
}: GridInitialsInputProps) => {
  const [initials, setInitials] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmed = initials.trim().toUpperCase();
    
    if (trimmed.length < 1 || trimmed.length > 3) {
      toast.error('Please enter 1-3 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitGridScore({
        date_local: dateSeed,
        moves,
        words_used: wordsUsed,
        time_to_complete_ms: timeToCompleteMs,
        initials: trimmed,
      });

      toast.success('Score submitted to leaderboard!');
      onSubmitted();
      onClose();
    } catch (error: any) {
      console.error('Error submitting Grid score:', error);
      if (error.message?.includes('already submitted')) {
        toast.error('You have already submitted a score for today');
        onSubmitted();
        onClose();
      } else {
        toast.error('Failed to submit score. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    onSubmitted();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Submit to Leaderboard</DialogTitle>
          <DialogDescription>
            Enter your initials (1-3 characters) to appear on the daily leaderboard
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="text-center">
            <div className="text-4xl font-bold mb-1">{moves}</div>
            <div className="text-sm text-muted-foreground">Moves · {wordsUsed} Words</div>
          </div>

          <Input
            placeholder="ABC"
            value={initials}
            onChange={(e) => setInitials(e.target.value.slice(0, 3))}
            className="text-center text-lg font-semibold uppercase"
            maxLength={3}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isSubmitting) {
                handleSubmit();
              }
            }}
          />

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleSkip}
              disabled={isSubmitting}
              className="flex-1"
            >
              Skip
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
