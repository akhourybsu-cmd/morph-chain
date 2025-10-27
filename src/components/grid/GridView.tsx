import { useGridStore } from '@/stores/gridStore';
import { GridTile } from './GridTile';

export const GridView = () => {
  const { grid, selected, selectTile } = useGridStore();
  
  return (
    <div className="w-full max-w-[min(92vw,420px)] mx-auto">
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {grid.map((row, rowIndex) =>
          row.map((tile, colIndex) => {
            const selectedIndex = selected.findIndex(t => t.id === tile.id);
            const isSelected = selectedIndex !== -1;
            
            return (
              <GridTile
                key={tile.id}
                tile={tile}
                isSelected={isSelected}
                selectionIndex={isSelected ? selectedIndex : undefined}
                onClick={() => selectTile(tile)}
              />
            );
          })
        )}
      </div>
    </div>
  );
};
