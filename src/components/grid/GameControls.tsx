import { useGridStore } from '@/stores/gridStore';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useRef } from 'react';

export const GameControls = () => {
  const { selected, submitWord, clearSelection } = useGridStore();
  const swipeStartXRef = useRef<number | null>(null);
  
  const handleSubmit = () => {
    if (selected.length < 3) {
      toast.error('Word must be at least 3 letters');
      return;
    }
    
    const success = submitWord();
    
    if (success) {
      toast.success('Valid word!', { duration: 1500 });
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
    if (selected.length >= 3) {
      swipeStartXRef.current = e.touches[0].clientX;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (swipeStartXRef.current !== null && selected.length >= 3) {
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
        disabled={selected.length < 3}
        className="flex-[2] h-full text-base font-bold bg-primary hover:bg-primary/90 shadow-lg rounded-2xl disabled:opacity-50"
      >
        Submit
      </Button>
    </div>
  );
};
