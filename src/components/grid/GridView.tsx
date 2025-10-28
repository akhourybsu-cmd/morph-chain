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
        if (tiles.length >= 3) {
          const success = submitWord();
          if (success) {
            toast.success('Valid word!', { duration: 1500 });
          } else {
            const word = tiles.map(t => t.char).join('');
            toast.error(`"${word}" is not in the dictionary`, {
              duration: 2000,
              className: 'shake-animation'
            });
          }
        } else if (tiles.length > 0) {
          toast.error('Word must be at least 3 letters', { duration: 1500 });
        }
        setPathTiles([]);
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
        className="grid grid-cols-5 gap-2 select-none"
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
      
      {/* Selection path SVG overlay (optional enhancement) */}
      {pathTiles.length > 1 && (
        <svg 
          className="absolute inset-0 pointer-events-none"
          style={{ width: '100%', height: '100%' }}
        >
          <path
            d={generatePathD(pathTiles, gridRef.current)}
            stroke="rgba(127, 178, 255, 0.6)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );
};

// Helper to generate SVG path from tiles
function generatePathD(tiles: any[], gridElement: HTMLElement | null): string {
  if (!gridElement || tiles.length < 2) return '';
  
  const gridRect = gridElement.getBoundingClientRect();
  const points: string[] = [];
  
  tiles.forEach((tile, idx) => {
    const tileElement = gridElement.querySelector(`[data-tile-id="${tile.id}"]`);
    if (tileElement) {
      const rect = tileElement.getBoundingClientRect();
      const x = rect.left + rect.width / 2 - gridRect.left;
      const y = rect.top + rect.height / 2 - gridRect.top;
      points.push(`${idx === 0 ? 'M' : 'L'} ${x} ${y}`);
    }
  });
  
  return points.join(' ');
}
