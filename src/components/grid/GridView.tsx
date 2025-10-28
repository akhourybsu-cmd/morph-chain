import { useRef, useEffect, useState } from 'react';
import { useGridStore } from '@/stores/gridStore';
import { GridTile } from './GridTile';
import { useGridGesture } from '@/hooks/useGridGesture';
import { toast } from 'sonner';

export const GridView = () => {
  const { grid, selected, selectTile, setSelected, submitWord, clearSelection } = useGridStore();
  const gridRef = useRef<HTMLDivElement>(null);
  const [pathTiles, setPathTiles] = useState(selected);

  // Drag gesture handling
  useGridGesture(
    {
      grid,
      gridElement: gridRef.current,
      enabled: true
    },
    {
      onPathUpdate: (tiles) => {
        setPathTiles(tiles);
        setSelected(tiles);
      },
      onPathComplete: (tiles) => {
        // Just update selection, don't auto-submit
        setPathTiles(tiles);
        setSelected(tiles);
      },
      onInvalidMove: () => {
        // Optional: Add haptic feedback here
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
      }
    }
  );

  // Sync path tiles with selected from store
  useEffect(() => {
    setPathTiles(selected);
  }, [selected]);
  
  return (
    <div className="w-full max-w-[min(92vw,520px)] mx-auto">
      <div 
        ref={gridRef}
        className="grid grid-cols-5 gap-3 select-none"
        style={{
          touchAction: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none'
        }}
      >
        {grid.map((row, rowIndex) =>
          row.map((tile, colIndex) => {
            const selectedIndex = pathTiles.findIndex(t => t.id === tile.id);
            const isSelected = selectedIndex !== -1;
            
            return (
              <GridTile
                key={tile.id}
                tile={tile}
                isSelected={isSelected}
                selectionIndex={isSelected ? selectedIndex : undefined}
                onClick={() => {
                  // Tap-to-add mode (optional fallback)
                  selectTile(tile);
                }}
              />
            );
          })
        )}
      </div>
      
    </div>
  );
};

