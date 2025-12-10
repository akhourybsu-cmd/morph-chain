import { useState } from 'react';

interface WordDropZoneProps {
  word: string;
  draggingLetter: string | null;
  onDrop: (position: number, letter: string) => void;
  highlightedPosition: number | null;
  onHighlight: (position: number | null) => void;
  shake: boolean;
}

export const WordDropZone = ({ 
  word, 
  draggingLetter, 
  onDrop, 
  highlightedPosition, 
  onHighlight,
  shake
}: WordDropZoneProps) => {
  const handleDragOver = (e: React.DragEvent, position: number) => {
    e.preventDefault();
    onHighlight(position);
  };

  const handleDragLeave = () => {
    onHighlight(null);
  };

  const handleDrop = (e: React.DragEvent, position: number) => {
    e.preventDefault();
    const letter = e.dataTransfer.getData('text/plain');
    if (letter) {
      onDrop(position, letter);
    }
    onHighlight(null);
  };

  return (
    <div 
      className={`flex justify-center gap-2 ${shake ? 'animate-shake' : ''}`}
      style={{ perspective: '1000px' }}
    >
      {word.split('').map((letter, i) => {
        const isHighlighted = highlightedPosition === i;
        
        return (
          <div
            key={i}
            onDragOver={(e) => handleDragOver(e, i)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, i)}
            className={`
              w-14 h-14 md:w-16 md:h-16 rounded-xl flex items-center justify-center
              transition-all duration-150 ease-out
              ${isHighlighted ? 'scale-105' : ''}
            `}
            style={{ 
              fontFamily: "'Playfair Display', Georgia, serif",
              background: isHighlighted 
                ? 'hsl(var(--rush-drop-target) / 0.15)' 
                : 'hsl(var(--rush-card-bg))',
              border: `2px solid ${isHighlighted 
                ? 'hsl(var(--rush-drop-target))' 
                : 'hsl(var(--rush-card-border))'
              }`,
              boxShadow: isHighlighted 
                ? '0 0 16px hsl(var(--rush-drop-target) / 0.3)' 
                : '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <span 
              className="text-2xl md:text-3xl font-bold uppercase"
              style={{ color: 'hsl(var(--rush-text-primary))' }}
            >
              {isHighlighted && draggingLetter ? draggingLetter : letter}
            </span>
          </div>
        );
      })}
    </div>
  );
};
