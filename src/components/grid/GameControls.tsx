import { useGridStore } from '@/stores/gridStore';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const GameControls = () => {
  const { selected, submitWord, clearSelection, endGame } = useGridStore();
  
  const handleSubmit = () => {
    const success = submitWord();
    
    if (success) {
      toast.success('Valid word!');
    } else {
      const word = selected.map(t => t.char).join('');
      if (selected.length < 3) {
        toast.error('Word must be at least 3 letters');
      } else {
        toast.error(`"${word}" is not valid`);
      }
    }
  };
  
  return (
    <div className="flex gap-2 sm:gap-3 px-2 sm:px-4 py-3 sm:py-4">
      <Button
        variant="outline"
        onClick={clearSelection}
        disabled={selected.length === 0}
        className="flex-1 text-sm sm:text-base"
        size="lg"
      >
        Clear
      </Button>
      
      <Button
        onClick={handleSubmit}
        disabled={selected.length < 3}
        className="flex-1 bg-primary hover:bg-primary/90 text-sm sm:text-base"
        size="lg"
      >
        Submit
      </Button>
      
      <Button
        variant="destructive"
        onClick={endGame}
        className="text-sm sm:text-base"
        size="lg"
      >
        End
      </Button>
    </div>
  );
};
