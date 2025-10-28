import { useCallback, useEffect, useRef } from 'react';
import { Tile } from '@/lib/grid/gridGenerator';

interface GestureCallbacks {
  onPathUpdate: (tiles: Tile[]) => void;
  onPathComplete: (tiles: Tile[]) => void;
  onInvalidMove: () => void;
}

interface GridGestureOptions {
  grid: Tile[][];
  gridElement: HTMLElement | null;
  enabled: boolean;
}

export const useGridGesture = (
  options: GridGestureOptions,
  callbacks: GestureCallbacks
) => {
  const { grid, gridElement, enabled } = options;
  const { onPathUpdate, onPathComplete, onInvalidMove } = callbacks;
  
  const isDraggingRef = useRef(false);
  const currentPathRef = useRef<Set<string>>(new Set());
  const pathTilesRef = useRef<Tile[]>([]);
  const lastTileRef = useRef<string | null>(null);
  const pointerIdRef = useRef<number | null>(null);

  // Helper: Get tile at coordinates
  const getTileAtPoint = useCallback((x: number, y: number): Tile | null => {
    if (!gridElement) return null;
    
    const elements = document.elementsFromPoint(x, y);
    const tileButton = elements.find(el => 
      el.classList.contains('grid-tile') && el.hasAttribute('data-tile-id')
    ) as HTMLElement;
    
    if (!tileButton) return null;
    
    const tileId = tileButton.getAttribute('data-tile-id');
    if (!tileId) return null;
    
    // Find tile in grid
    for (const row of grid) {
      const tile = row.find(t => t.id === tileId);
      if (tile) return tile;
    }
    
    return null;
  }, [grid, gridElement]);

  // Helper: Check if two tiles are adjacent (8-way)
  const isAdjacent = useCallback((tile1: Tile, tile2: Tile): boolean => {
    const rowDiff = Math.abs(tile1.row - tile2.row);
    const colDiff = Math.abs(tile1.col - tile2.col);
    return rowDiff <= 1 && colDiff <= 1 && (rowDiff + colDiff > 0);
  }, []);

  // Helper: Add tile to path
  const addTileToPath = useCallback((tile: Tile) => {
    const tileKey = tile.id;
    
    // Check if this is backtracking (moving to second-to-last tile)
    if (pathTilesRef.current.length >= 2) {
      const secondToLast = pathTilesRef.current[pathTilesRef.current.length - 2];
      if (secondToLast.id === tileKey) {
        // Backtrack: remove last tile
        const removed = pathTilesRef.current.pop();
        if (removed) {
          currentPathRef.current.delete(removed.id);
          lastTileRef.current = pathTilesRef.current.length > 0 
            ? pathTilesRef.current[pathTilesRef.current.length - 1].id 
            : null;
          onPathUpdate([...pathTilesRef.current]);
        }
        return true;
      }
    }
    
    // Check if already in path (no reuse except backtracking)
    if (currentPathRef.current.has(tileKey)) {
      return false;
    }
    
    // Check adjacency if not first tile
    if (pathTilesRef.current.length > 0) {
      const lastTile = pathTilesRef.current[pathTilesRef.current.length - 1];
      if (!isAdjacent(lastTile, tile)) {
        onInvalidMove();
        return false;
      }
    }
    
    // Add to path
    currentPathRef.current.add(tileKey);
    pathTilesRef.current.push(tile);
    lastTileRef.current = tileKey;
    onPathUpdate([...pathTilesRef.current]);
    
    return true;
  }, [isAdjacent, onPathUpdate, onInvalidMove]);

  // Handle pointer down (start gesture)
  const handlePointerDown = useCallback((e: PointerEvent) => {
    if (!enabled || !gridElement) return;
    
    const tile = getTileAtPoint(e.clientX, e.clientY);
    if (!tile) return;
    
    // Start new path
    isDraggingRef.current = true;
    pointerIdRef.current = e.pointerId;
    currentPathRef.current.clear();
    pathTilesRef.current = [];
    lastTileRef.current = null;
    
    // Add first tile
    addTileToPath(tile);
    
    // Capture pointer
    if (e.target instanceof Element) {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
    
    e.preventDefault();
  }, [enabled, gridElement, getTileAtPoint, addTileToPath]);

  // Handle pointer move (continue gesture)
  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!isDraggingRef.current || pointerIdRef.current !== e.pointerId) return;
    
    const tile = getTileAtPoint(e.clientX, e.clientY);
    if (!tile) return;
    
    // Only add if it's a new tile
    if (lastTileRef.current !== tile.id) {
      addTileToPath(tile);
    }
    
    e.preventDefault();
  }, [getTileAtPoint, addTileToPath]);

  // Handle pointer up (end gesture)
  const handlePointerUp = useCallback((e: PointerEvent) => {
    if (!isDraggingRef.current || pointerIdRef.current !== e.pointerId) return;
    
    isDraggingRef.current = false;
    pointerIdRef.current = null;
    
    // Complete the path
    if (pathTilesRef.current.length >= 3) {
      onPathComplete([...pathTilesRef.current]);
    } else if (pathTilesRef.current.length > 0) {
      // Clear if too short
      onPathUpdate([]);
    }
    
    // Clear refs
    currentPathRef.current.clear();
    pathTilesRef.current = [];
    lastTileRef.current = null;
    
    e.preventDefault();
  }, [onPathComplete, onPathUpdate]);

  // Handle pointer cancel
  const handlePointerCancel = useCallback((e: PointerEvent) => {
    if (pointerIdRef.current !== e.pointerId) return;
    
    isDraggingRef.current = false;
    pointerIdRef.current = null;
    currentPathRef.current.clear();
    pathTilesRef.current = [];
    lastTileRef.current = null;
    onPathUpdate([]);
  }, [onPathUpdate]);

  // Attach/detach event listeners
  useEffect(() => {
    if (!gridElement || !enabled) return;
    
    gridElement.addEventListener('pointerdown', handlePointerDown);
    gridElement.addEventListener('pointermove', handlePointerMove);
    gridElement.addEventListener('pointerup', handlePointerUp);
    gridElement.addEventListener('pointercancel', handlePointerCancel);
    
    return () => {
      gridElement.removeEventListener('pointerdown', handlePointerDown);
      gridElement.removeEventListener('pointermove', handlePointerMove);
      gridElement.removeEventListener('pointerup', handlePointerUp);
      gridElement.removeEventListener('pointercancel', handlePointerCancel);
    };
  }, [gridElement, enabled, handlePointerDown, handlePointerMove, handlePointerUp, handlePointerCancel]);

  return {
    isDragging: isDraggingRef.current,
    currentPath: pathTilesRef.current
  };
};
