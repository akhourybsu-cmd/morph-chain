import { useCallback, useEffect, useRef } from 'react';
import { Tile } from '@/lib/grid/gridGenerator';

interface AudioCallbacks {
  onTileSound?: (chainIndex: number) => void;
  onBacktrackSound?: () => void;
  onInvalidSound?: () => void;
}

interface GestureCallbacks {
  onPathUpdate: (tiles: Tile[]) => void;
  onPathComplete: (tiles: Tile[]) => void;
  onInvalidMove: () => void;
  audio?: AudioCallbacks;
}

interface GridGestureOptions {
  grid: Tile[][];
  gridElement: HTMLElement | null;
  enabled: boolean;
}

const TAP_THRESHOLD_MS = 200;
const TAP_MOVE_THRESHOLD_PX = 10;

export const useGridGesture = (
  options: GridGestureOptions,
  callbacks: GestureCallbacks
) => {
  const { grid, gridElement, enabled } = options;
  const { onPathUpdate, onPathComplete, onInvalidMove, audio } = callbacks;
  
  const isDraggingRef = useRef(false);
  const currentPathRef = useRef<Set<string>>(new Set());
  const pathTilesRef = useRef<Tile[]>([]);
  const lastTileRef = useRef<string | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  
  // Tap detection refs
  const pointerDownTimeRef = useRef<number>(0);
  const pointerDownPosRef = useRef<{ x: number; y: number } | null>(null);
  const hasDraggedRef = useRef(false);

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
          audio?.onBacktrackSound?.();
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
        audio?.onInvalidSound?.();
        return false;
      }
    }
    
    // Add to path
    currentPathRef.current.add(tileKey);
    pathTilesRef.current.push(tile);
    lastTileRef.current = tileKey;
    onPathUpdate([...pathTilesRef.current]);
    
    // Play tile select sound with chain index
    audio?.onTileSound?.(pathTilesRef.current.length - 1);
    
    return true;
  }, [isAdjacent, onPathUpdate, onInvalidMove, audio]);

  // Handle tap on tile (for tap-to-build mode)
  const handleTap = useCallback((tile: Tile) => {
    // If tapping the last tile, treat as undo
    if (pathTilesRef.current.length > 0 && 
        pathTilesRef.current[pathTilesRef.current.length - 1].id === tile.id) {
      const removed = pathTilesRef.current.pop();
      if (removed) {
        currentPathRef.current.delete(removed.id);
        lastTileRef.current = pathTilesRef.current.length > 0 
          ? pathTilesRef.current[pathTilesRef.current.length - 1].id 
          : null;
        onPathUpdate([...pathTilesRef.current]);
        audio?.onBacktrackSound?.();
      }
      return;
    }
    
    // Otherwise add tile to path
    addTileToPath(tile);
  }, [addTileToPath, onPathUpdate, audio]);

  // Handle pointer down (start gesture)
  const handlePointerDown = useCallback((e: PointerEvent) => {
    if (!enabled || !gridElement) return;
    
    const tile = getTileAtPoint(e.clientX, e.clientY);
    if (!tile) return;
    
    // Record start position and time for tap detection
    pointerDownTimeRef.current = Date.now();
    pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
    hasDraggedRef.current = false;
    
    // Start dragging state
    isDraggingRef.current = true;
    pointerIdRef.current = e.pointerId;
    
    // If no current path, start new one
    if (pathTilesRef.current.length === 0) {
      currentPathRef.current.clear();
      addTileToPath(tile);
    }
    
    // Capture pointer
    if (e.target instanceof Element) {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
    
    e.preventDefault();
  }, [enabled, gridElement, getTileAtPoint, addTileToPath]);

  // Handle pointer move (continue gesture)
  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!isDraggingRef.current || pointerIdRef.current !== e.pointerId) return;
    
    // Check if we've moved enough to consider this a drag
    if (pointerDownPosRef.current) {
      const dx = e.clientX - pointerDownPosRef.current.x;
      const dy = e.clientY - pointerDownPosRef.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > TAP_MOVE_THRESHOLD_PX) {
        hasDraggedRef.current = true;
      }
    }
    
    const tile = getTileAtPoint(e.clientX, e.clientY);
    if (!tile) return;
    
    // Only add if it's a new tile and we're dragging
    if (hasDraggedRef.current && lastTileRef.current !== tile.id) {
      addTileToPath(tile);
    }
    
    e.preventDefault();
  }, [getTileAtPoint, addTileToPath]);

  // Handle pointer up (end gesture)
  const handlePointerUp = useCallback((e: PointerEvent) => {
    if (!isDraggingRef.current || pointerIdRef.current !== e.pointerId) return;
    
    const tile = getTileAtPoint(e.clientX, e.clientY);
    const elapsed = Date.now() - pointerDownTimeRef.current;
    
    // Check if this was a tap (short duration, minimal movement)
    if (tile && elapsed < TAP_THRESHOLD_MS && !hasDraggedRef.current) {
      handleTap(tile);
    } else if (hasDraggedRef.current && pathTilesRef.current.length > 0) {
      // End of drag - just complete path without clearing
      onPathComplete([...pathTilesRef.current]);
    }
    
    isDraggingRef.current = false;
    pointerIdRef.current = null;
    pointerDownPosRef.current = null;
    
    e.preventDefault();
  }, [getTileAtPoint, handleTap, onPathComplete]);

  // Handle pointer cancel
  const handlePointerCancel = useCallback((e: PointerEvent) => {
    if (pointerIdRef.current !== e.pointerId) return;
    
    isDraggingRef.current = false;
    pointerIdRef.current = null;
    pointerDownPosRef.current = null;
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

  // Clear path function for external use
  const clearPath = useCallback(() => {
    currentPathRef.current.clear();
    pathTilesRef.current = [];
    lastTileRef.current = null;
    onPathUpdate([]);
  }, [onPathUpdate]);

  return {
    isDragging: isDraggingRef.current,
    currentPath: pathTilesRef.current,
    clearPath
  };
};
