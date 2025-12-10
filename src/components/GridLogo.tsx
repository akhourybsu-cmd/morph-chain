import { useNavigate } from "react-router-dom";

export const GridLogo = ({ className = "" }: { className?: string }) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/')}
      className={`flex items-center gap-1.5 hover:opacity-80 transition-opacity ${className}`}
      aria-label="Go to home"
    >
      <span 
        className="font-playfair font-semibold tracking-tight whitespace-nowrap text-lg sm:text-xl"
        style={{ letterSpacing: '-0.01em' }}
      >
        <span className="text-[hsl(var(--grid-text-primary))]">
          Morph
        </span>
        {' '}
        <span className="text-[hsl(var(--grid-accent))]">
          Grid
        </span>
      </span>
    </button>
  );
};
