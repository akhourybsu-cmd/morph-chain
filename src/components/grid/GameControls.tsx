import { useGridStore } from '@/stores/gridStore';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const GameControls = () => {
  const { selected, submitWord, clearSelection, endGame } = useGridStore();
  
  const handleSubmit = () => {
    const success = submitWord();
    
    if (success) {
      toast.success('Valid word!', { duration: 1500 });
    } else {
      const word = selected.map(t => t.char).join('');
      if (selected.length < 3) {
        toast.error('Word must be at least 3 letters');
      } else {
        toast.error(`"${word}" is not in the dictionary`);
      }
    }
  };
  
  return (
    <div className="flex gap-2 mt-2">
      <Button
        variant="outline"
        onClick={clearSelection}
        disabled={selected.length === 0}
        className="flex-1 h-10 md:h-11 text-sm md:text-base font-semibold"
      >
        Clear
      </Button>
      
      <Button
        onClick={handleSubmit}
        disabled={selected.length < 3}
        className="flex-[2] h-10 md:h-11 text-sm md:text-base font-bold bg-primary hover:bg-primary/90 shadow-lg"
      >
        Submit Word
      </Button>
      
      <Button
        variant="destructive"
        onClick={endGame}
        className="px-3 md:px-4 h-10 md:h-11 text-sm md:text-base font-semibold"
      >
        End
      </Button>
    </div>
  );
};
