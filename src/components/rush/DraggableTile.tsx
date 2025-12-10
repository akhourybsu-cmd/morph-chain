import { useState, useRef, useEffect } from 'react';

interface DraggableTileProps {
  letter: string;
  index: number;
  onDragStart: (letter: string, index: number) => void;
  onDragEnd: () => void;
  isDragging: boolean;
}

export const DraggableTile = ({ 
  letter, 
  index, 
  onDragStart, 
  onDragEnd, 
  isDragging 
}: DraggableTileProps) => {
  const tileRef = useRef<HTMLDivElement>(null);
  const [touchActive, setTouchActive] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', letter);
    e.dataTransfer.setData('index', String(index));
    onDragStart(letter, index);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchActive(true);
    onDragStart(letter, index);
  };

  const handleTouchEnd = () => {
    setTouchActive(false);
    onDragEnd();
  };

  return (
    <div
      ref={tileRef}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`
        w-11 h-11 md:w-12 md:h-12 rounded-xl flex items-center justify-center
        cursor-grab active:cursor-grabbing select-none
        transition-all duration-150 ease-out
        ${isDragging || touchActive
          ? 'scale-110 shadow-lg opacity-70 z-50' 
          : 'hover:shadow-md hover:scale-105'
        }
      `}
      style={{
        background: 'hsl(var(--rush-tile-bg))',
        border: '1px solid hsl(var(--rush-tile-border))',
        boxShadow: isDragging || touchActive
          ? '0 8px 20px rgba(0,0,0,0.15)'
          : '0 2px 4px rgba(0,0,0,0.05)',
        fontFamily: "'Playfair Display', Georgia, serif",
      }}
    >
      <span className="text-xl md:text-2xl font-bold uppercase text-[hsl(var(--rush-text-primary))]">
        {letter}
      </span>
    </div>
  );
};
