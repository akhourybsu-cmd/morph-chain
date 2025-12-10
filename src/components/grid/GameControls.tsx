import { useGridStore } from '@/stores/gridStore';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useRef } from 'react';

export const GameControls = () => {
  const { selected, submitWord, clearSelection } = useGridStore();
  const swipeStartXRef = useRef<number | null>(null);
  
  const handleSubmit = () => {
    if (selected.length < 4) {
      toast.error('Word must be at least 4 letters');
      return;
    }
    
    const success = submitWord();
    
    if (success) {
      // Visual feedback handled by WordCelebration component
      clearSelection();
    } else {
      const word = selected.map(t => t.char).join('');
      toast.error(`"${word}" is not in the dictionary`, {
        duration: 2000,
        className: 'shake-animation'
      });
    }
  };

  // Swipe-to-submit on word preview
  const handleTouchStart = (e: React.TouchEvent) => {
    if (selected.length >= 4) {
      swipeStartXRef.current = e.touches[0].clientX;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (swipeStartXRef.current !== null && selected.length >= 4) {
      const endX = e.changedTouches[0].clientX;
      const distance = endX - swipeStartXRef.current;
      
      // Swipe right at least 48px
      if (distance > 48) {
        handleSubmit();
      }
    }
    swipeStartXRef.current = null;
  };
  
  return (
    <div className="flex gap-2 h-14">
      <Button
        variant="ghost"
        onClick={clearSelection}
        disabled={selected.length === 0}
        className="flex-1 h-full text-sm font-semibold rounded-2xl"
      >
        Clear
      </Button>
      
      <Button
        onClick={handleSubmit}
        disabled={selected.length < 4}
        className="flex-[2] h-full text-base font-bold rounded-2xl disabled:opacity-50 bg-gradient-to-r from-[hsl(var(--grid-accent-start))] via-[hsl(var(--grid-accent-mid))] to-[hsl(var(--grid-accent-end))] hover:opacity-90 shadow-[0_0_20px_hsl(var(--grid-glow)/0.4)] transition-all"
        style={{
          textShadow: '0 0 10px rgba(0,0,0,0.5)'
        }}
      >
        Submit
      </Button>
    </div>
  );
};