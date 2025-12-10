import { useGridStore } from '@/stores/gridStore';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export const GameControls = () => {
  const { selected, submitWord, clearSelection } = useGridStore();
  
  const handleSubmit = () => {
    if (selected.length < 4) {
      toast.error('Word must be at least 4 letters');
      return;
    }
    
    const success = submitWord();
    
    if (success) {
      clearSelection();
    } else {
      const word = selected.map(t => t.char).join('');
      toast.error(`"${word}" is not in the dictionary`, {
        duration: 2000,
        className: 'shake-animation'
      });
    }
  };
  
  return (
    <div className="flex gap-3 h-12">
      {/* Clear - Ghost pill style */}
      <Button
        variant="ghost"
        onClick={clearSelection}
        disabled={selected.length === 0}
        className="flex-1 h-full text-sm font-inter font-medium rounded-full border border-[hsl(37,20%,82%)] text-[hsl(var(--grid-text-secondary))] hover:bg-[hsl(var(--grid-pill-bg))] disabled:opacity-40"
      >
        Clear
      </Button>
      
      {/* Submit - Primary pill style */}
      <Button
        onClick={handleSubmit}
        disabled={selected.length < 4}
        className="flex-[2] h-full text-sm font-inter font-semibold rounded-full disabled:opacity-40 bg-[hsl(var(--grid-accent))] hover:bg-[hsl(193,46%,28%)] text-white shadow-[0_4px_10px_rgba(47,109,128,0.25)] hover:-translate-y-px hover:shadow-[0_6px_14px_rgba(47,109,128,0.35)] active:translate-y-0 active:shadow-[0_2px_6px_rgba(47,109,128,0.2)] transition-all duration-150"
      >
        Submit
      </Button>
    </div>
  );
};
