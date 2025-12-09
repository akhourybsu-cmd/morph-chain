import { useRef, useEffect, useState } from 'react';
import { useGridStore } from '@/stores/gridStore';
import { GridTile } from './GridTile';
import { useGridGesture } from '@/hooks/useGridGesture';
import { WordCelebration } from './WordCelebration';

export const GridView = () => {
  const { grid, selected, selectTile, setSelected, submitWord, clearSelection, lastSubmission } = useGridStore();
  const gridRef = useRef<HTMLDivElement>(null);
  const [pathTiles, setPathTiles] = useState(selected);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animatingTiles, setAnimatingTiles] = useState<Set<string>>(new Set());
  const [upgradingTiles, setUpgradingTiles] = useState<Set<string>>(new Set());

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
        drawConnectionPath(tiles);
      },
      onPathComplete: (tiles) => {
        setPathTiles(tiles);
        setSelected(tiles);
        clearConnectionPath();
      },
      onInvalidMove: () => {
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
      }
    }
  );

  // Draw connection path on canvas
  const drawConnectionPath = (tiles: typeof selected) => {
    const canvas = canvasRef.current;
    const gridElement = gridRef.current;
    if (!canvas || !gridElement || tiles.length < 2) {
      clearConnectionPath();
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = gridElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
    ctx.shadowBlur = 4;

    ctx.beginPath();
    tiles.forEach((tile, index) => {
      const tileElement = gridElement.querySelector(`[data-tile-id="${tile.id}"]`);
      if (!tileElement) return;

      const tileRect = tileElement.getBoundingClientRect();
      const x = tileRect.left - rect.left + tileRect.width / 2;
      const y = tileRect.top - rect.top + tileRect.height / 2;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
  };

  const clearConnectionPath = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // Sync path tiles with selected from store
  useEffect(() => {
    setPathTiles(selected);
    if (selected.length === 0) {
      clearConnectionPath();
    }
  }, [selected]);

  // Handle tile animations on word submission
  useEffect(() => {
    if (lastSubmission) {
      // Set animating tiles
      setAnimatingTiles(new Set(lastSubmission.usedTileIds));
      
      // Set upgrading tiles with a slight delay
      if (lastSubmission.upgradedTileIds.length > 0) {
        setTimeout(() => {
          setUpgradingTiles(new Set(lastSubmission.upgradedTileIds));
        }, 200);
      }

      // Clear animations after they complete
      const timer = setTimeout(() => {
        setAnimatingTiles(new Set());
        setUpgradingTiles(new Set());
      }, 600);

      return () => clearTimeout(timer);
    }
  }, [lastSubmission]);

  // Get animation class based on word length
  const getAnimationClass = (tileId: string) => {
    if (!animatingTiles.has(tileId) || !lastSubmission) return undefined;
    
    const { wordLength } = lastSubmission;
    if (wordLength >= 7) return 'animate-tile-pop-epic';
    if (wordLength >= 6) return 'animate-tile-pop-large';
    if (wordLength >= 5) return 'animate-tile-pop-large';
    if (wordLength >= 4) return 'animate-tile-pop-medium';
    return 'animate-tile-pop-small';
  };
  
  return (
    <div className="w-full max-w-[min(92vw,520px)] mx-auto relative">
      {/* Connection path canvas overlay */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-10"
        style={{ width: '100%', height: '100%' }}
      />
      
      {/* Word celebration overlay */}
      <WordCelebration />
      
      {/* Grid with dark radial gradient background */}
      <div 
        ref={gridRef}
        className="grid grid-cols-5 gap-3 select-none relative rounded-3xl p-3"
        style={{
          touchAction: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none',
          background: 'radial-gradient(circle at center, #181818 0%, #111 50%, #000 100%)'
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
                animationClass={getAnimationClass(tile.id)}
                isUpgrading={upgradingTiles.has(tile.id)}
                onClick={() => {
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

