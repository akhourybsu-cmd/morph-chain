import React from 'react';
import { useNavigate } from 'react-router-dom';

interface AlibiLogoProps {
  className?: string;
}

export function AlibiLogo({ className = '' }: AlibiLogoProps) {
  const navigate = useNavigate();
  
  return (
    <button 
      onClick={() => navigate('/')}
      className={`flex items-center gap-1.5 font-playfair font-semibold tracking-tight text-lg sm:text-xl ${className}`}
    >
      <span style={{ color: 'hsl(var(--alibi-text-primary))' }}>Morph</span>
      <span style={{ color: 'hsl(var(--alibi-accent))' }}>Alibi</span>
    </button>
  );
}
