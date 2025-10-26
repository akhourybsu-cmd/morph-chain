import { useGridStore } from '@/stores/gridStore';

export const WordPreview = () => {
  const selected = useGridStore(state => state.selected);
  const word = selected.map(t => t.char).join('');
  
  return (
    <div className="min-h-12 sm:min-h-16 flex items-center justify-center px-2 sm:px-4">
      <div className="text-center">
        <div className="text-xs sm:text-sm text-muted-foreground mb-1">Current Word</div>
        <div className="text-2xl sm:text-3xl font-outfit font-bold tracking-wide text-foreground">
          {word || '—'}
        </div>
        {selected.length > 0 && (
          <div className="text-[10px] sm:text-xs text-muted-foreground mt-1">
            {selected.length} letter{selected.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
};
