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

const HIT_ZONE_PADDING = 8; // Pixels to expand hit zones for easier diagonal selection

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

  // Helper: Get all tile elements with their bounding rects
  const getTileElements = useCallback((): Map<string, { tile: Tile; rect: DOMRect }> => {
    const tileMap = new Map<string, { tile: Tile; rect: DOMRect }>();
    if (!gridElement) return tileMap;
    
    const tileButtons = gridElement.querySelectorAll('.grid-tile[data-tile-id]');
    tileButtons.forEach(button => {
      const tileId = button.getAttribute('data-tile-id');
      if (!tileId) return;
      
      for (const row of grid) {
        const tile = row.find(t => t.id === tileId);
        if (tile) {
          tileMap.set(tileId, { tile, rect: button.getBoundingClientRect() });
          break;
        }
      }
    });
    
    return tileMap;
  }, [grid, gridElement]);

  // Helper: Check if point is within expanded tile bounds
  const isPointInExpandedRect = (x: number, y: number, rect: DOMRect, padding: number): boolean => {
    return (
      x >= rect.left - padding &&
      x <= rect.right + padding &&
      y >= rect.top - padding &&
      y <= rect.bottom + padding
    );
  };

  // Helper: Get distance from point to rect center
  const getDistanceToRectCenter = (x: number, y: number, rect: DOMRect): number => {
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    return Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
  };

  // Helper: Check if two tiles are adjacent (8-way)
  const isAdjacent = useCallback((tile1: Tile, tile2: Tile): boolean => {
    const rowDiff = Math.abs(tile1.row - tile2.row);
    const colDiff = Math.abs(tile1.col - tile2.col);
    return rowDiff <= 1 && colDiff <= 1 && (rowDiff + colDiff > 0);
  }, []);

  // Helper: Get tile at coordinates with expanded hit zones and snap-to-adjacent
  const getTileAtPoint = useCallback((x: number, y: number): Tile | null => {
    if (!gridElement) return null;
    
    const tileElements = getTileElements();
    
    // First try exact hit
    for (const [, { tile, rect }] of tileElements) {
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        return tile;
      }
    }
    
    // Try expanded hit zones with snap-to-adjacent logic
    let closestTile: Tile | null = null;
    let closestDistance = Infinity;
    
    const lastTile = pathTilesRef.current.length > 0 
      ? pathTilesRef.current[pathTilesRef.current.length - 1] 
      : null;
    
    for (const [, { tile, rect }] of tileElements) {
      // Check if point is within expanded bounds
      if (!isPointInExpandedRect(x, y, rect, HIT_ZONE_PADDING)) continue;
      
      // If we have a path, prioritize adjacent tiles
      if (lastTile) {
        if (!isAdjacent(lastTile, tile)) continue;
        
        // Among adjacent tiles in expanded zone, pick closest
        const distance = getDistanceToRectCenter(x, y, rect);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestTile = tile;
        }
      } else {
        // No path yet, just find closest
        const distance = getDistanceToRectCenter(x, y, rect);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestTile = tile;
        }
      }
    }
    
    return closestTile;
  }, [gridElement, getTileElements, isAdjacent]);

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

  // Handle pointer down (start gesture)
  const handlePointerDown = useCallback((e: PointerEvent) => {
    if (!enabled || !gridElement) return;
    
    const tile = getTileAtPoint(e.clientX, e.clientY);
    if (!tile) return;
    
    // Start dragging state
    isDraggingRef.current = true;
    pointerIdRef.current = e.pointerId;
    
    // Start new path with this tile
    currentPathRef.current.clear();
    pathTilesRef.current = [];
    lastTileRef.current = null;
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
    
    if (pathTilesRef.current.length > 0) {
      onPathComplete([...pathTilesRef.current]);
    }
    
    isDraggingRef.current = false;
    pointerIdRef.current = null;
    
    e.preventDefault();
  }, [onPathComplete]);

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
