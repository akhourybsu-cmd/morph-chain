import { useGridStore } from '@/stores/gridStore';

export const WordPreview = () => {
  const selected = useGridStore(state => state.selected);
  const word = selected.map(t => t.char).join('');
  
  return (
    <div className="flex items-center justify-center py-2 min-h-[3rem]">
      {selected.length > 0 ? (
        <div className="flex items-center gap-1.5">
          {selected.map((tile, idx) => (
            <span key={tile.id} className="flex items-center gap-1.5">
              <span className="font-outfit font-bold text-lg sm:text-xl text-foreground tracking-wide">
                {tile.char}
              </span>
              {idx < selected.length - 1 && (
                <span className="text-muted-foreground text-sm">·</span>
              )}
            </span>
          ))}
          <span className="ml-2 text-xs text-muted-foreground">
            ({selected.length})
          </span>
        </div>
      ) : (
        <div className="text-muted-foreground text-sm">​</div>
      )}
    </div>
  );
};
