import React from 'react';

interface AlibiLogoProps {
  className?: string;
}

export function AlibiLogo({ className = '' }: AlibiLogoProps) {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <span 
        className="text-[10px] tracking-[0.2em] uppercase"
        style={{ color: 'hsl(var(--alibi-text-muted))' }}
      >
        Morph Games
      </span>
      <h1 
        className="font-serif text-2xl md:text-3xl tracking-tight"
        style={{ color: 'hsl(var(--alibi-text-primary))' }}
      >
        Alibi
      </h1>
    </div>
  );
}
