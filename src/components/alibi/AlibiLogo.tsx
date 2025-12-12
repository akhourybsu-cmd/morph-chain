import React from 'react';

interface AlibiLogoProps {
  className?: string;
}

export function AlibiLogo({ className = '' }: AlibiLogoProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <h1 className="font-serif text-xl md:text-2xl tracking-tight">
        <span className="text-alibi-text-primary">Morph</span>
        {' '}
        <span className="text-alibi-accent">Alibi</span>
      </h1>
    </div>
  );
}
