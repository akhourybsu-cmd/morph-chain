import { useRef, useEffect, useState } from 'react';
import { useGridStore } from '@/stores/gridStore';
import { GridTile } from './GridTile';
import { useGridGesture } from '@/hooks/useGridGesture';
import { useGridAudio } from '@/hooks/useGridAudio';

export const GridView = () => {
  const { grid, selected, selectTile, setSelected, submitWord, clearSelection, lastSubmission } = useGridStore();
  const gridRef = useRef<HTMLDivElement>(null);
  const [pathTiles, setPathTiles] = useState(selected);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animatingTiles, setAnimatingTiles] = useState<Set<string>>(new Set());
  const [upgradingTiles, setUpgradingTiles] = useState<Set<string>>(new Set());
  
  const { playTileSelect, playBacktrack, playInvalidMove, playWordSubmit, playTileUpgrade } = useGridAudio();

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
      },
      audio: {
        onTileSound: playTileSelect,
        onBacktrackSound: playBacktrack,
        onInvalidSound: playInvalidMove,
      }
    }
  );

  // Draw connection path on canvas - NYT style: subtle teal line
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
    // NYT Prestige: subtle teal connection line
    ctx.strokeStyle = 'rgba(47, 109, 128, 0.4)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

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
      // Play word submission sound
      playWordSubmit(lastSubmission.wordLength);
      
      // Set animating tiles for used tiles
      setAnimatingTiles(new Set(lastSubmission.usedTileIds));
      
      // Clear used tile animations after pop completes
      const popTimer = setTimeout(() => {
        setAnimatingTiles(new Set());
      }, 300);
      
      // Only set up upgrade animations if there are upgraded tiles
      let upgradeClearTimer: ReturnType<typeof setTimeout> | null = null;
      
      if (lastSubmission.upgradedTileIds.length > 0) {
        // Stagger the upgrade animations
        lastSubmission.upgradedTileIds.forEach((tileId, index) => {
          const startDelay = 400 + (index * 100);
          setTimeout(() => {
            setUpgradingTiles(prev => new Set([...prev, tileId]));
            playTileUpgrade(index === 0 ? 'orange' : 'blue');
          }, startDelay);
        });
        
        // Clear all upgrade animations after last one completes
        const lastTileDelay = 400 + (lastSubmission.upgradedTileIds.length - 1) * 100;
        upgradeClearTimer = setTimeout(() => {
          setUpgradingTiles(new Set());
        }, lastTileDelay + 220);
      }

      return () => {
        clearTimeout(popTimer);
        if (upgradeClearTimer) clearTimeout(upgradeClearTimer);
      };
    }
  }, [lastSubmission, playWordSubmit, playTileUpgrade]);

  // Get animation class based on word length - NYT style: subtle
  const getAnimationClass = (tileId: string) => {
    if (!animatingTiles.has(tileId) || !lastSubmission) return undefined;
    return 'animate-tile-pop-subtle';
  };
  
  return (
    <div className="w-full max-w-[420px] mx-auto relative">
      {/* NYT Prestige: White card wrapper for grid */}
      <div 
        className="bg-white rounded-xl p-5 md:p-6"
        style={{
          border: '1px solid hsl(var(--grid-card-border))',
          boxShadow: '0 8px 18px rgba(0,0,0,0.04)'
        }}
      >
        {/* Connection path canvas overlay */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none z-10"
          style={{ width: '100%', height: '100%' }}
        />
        
        {/* Grid */}
        <div 
          ref={gridRef}
          className="grid grid-cols-5 gap-2.5 select-none relative"
          style={{
            touchAction: 'none',
            WebkitUserSelect: 'none',
            userSelect: 'none',
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
    </div>
  );
};
