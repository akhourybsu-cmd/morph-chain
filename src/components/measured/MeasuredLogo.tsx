import { useNavigate } from 'react-router-dom';

interface MeasuredLogoProps {
  className?: string;
}

export function MeasuredLogo({ className = '' }: MeasuredLogoProps) {
  const navigate = useNavigate();
  
  return (
    <button 
      onClick={() => navigate('/')}
      className={`flex items-center gap-1.5 font-playfair font-semibold tracking-tight text-lg sm:text-xl ${className}`}
      aria-label="Go to home"
    >
      <span className="text-measured-text-primary">Morph</span>
      <span className="text-measured-accent">Measured</span>
    </button>
  );
}
