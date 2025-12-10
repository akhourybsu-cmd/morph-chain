import { useState, useCallback, useRef } from 'react';

interface DragState {
  letter: string;
  index: number;
  x: number;
  y: number;
}

interface UseRushDragDropReturn {
  isDragging: boolean;
  draggedTile: DragState | null;
  highlightedPosition: number | null;
  handleDragStart: (letter: string, index: number) => void;
  handleDragEnd: () => void;
  handleTouchMove: (e: TouchEvent, dropZoneRefs: React.RefObject<HTMLDivElement>[]) => void;
  handleTouchEnd: (dropZoneRefs: React.RefObject<HTMLDivElement>[], onDrop: (position: number, letter: string) => void) => void;
  setHighlightedPosition: (position: number | null) => void;
}

export function useRushDragDrop(): UseRushDragDropReturn {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedTile, setDraggedTile] = useState<DragState | null>(null);
  const [highlightedPosition, setHighlightedPosition] = useState<number | null>(null);

  const handleDragStart = useCallback((letter: string, index: number) => {
    setIsDragging(true);
    setDraggedTile({ letter, index, x: 0, y: 0 });
  }, []);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setDraggedTile(null);
    setHighlightedPosition(null);
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent, dropZoneRefs: React.RefObject<HTMLDivElement>[]) => {
    if (!isDragging || !draggedTile) return;
    
    const touch = e.touches[0];
    setDraggedTile(prev => prev ? { ...prev, x: touch.clientX, y: touch.clientY } : null);
    
    // Check which drop zone we're over
    let foundPosition: number | null = null;
    for (let i = 0; i < dropZoneRefs.length; i++) {
      const ref = dropZoneRefs[i];
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        if (
          touch.clientX >= rect.left &&
          touch.clientX <= rect.right &&
          touch.clientY >= rect.top &&
          touch.clientY <= rect.bottom
        ) {
          foundPosition = i;
          break;
        }
      }
    }
    setHighlightedPosition(foundPosition);
  }, [isDragging, draggedTile]);

  const handleTouchEnd = useCallback((
    dropZoneRefs: React.RefObject<HTMLDivElement>[], 
    onDrop: (position: number, letter: string) => void
  ) => {
    if (!draggedTile) return;
    
    // Check if we're over a drop zone
    if (highlightedPosition !== null) {
      onDrop(highlightedPosition, draggedTile.letter);
    }
    
    handleDragEnd();
  }, [draggedTile, highlightedPosition, handleDragEnd]);

  return {
    isDragging,
    draggedTile,
    highlightedPosition,
    handleDragStart,
    handleDragEnd,
    handleTouchMove,
    handleTouchEnd,
    setHighlightedPosition,
  };
}
