import { useNavigate } from "react-router-dom";

export const GridLogo = ({ className = "" }: { className?: string }) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/')}
      className={`flex items-center gap-1 hover:opacity-80 transition-opacity ${className}`}
      aria-label="Go to home"
    >
      <span 
        className="font-outfit font-bold tracking-tight whitespace-nowrap text-base sm:text-xl"
        style={{ letterSpacing: '-0.02em' }}
      >
        <span className="bg-gradient-to-r from-grid-accent-start to-grid-accent-mid bg-clip-text text-transparent opacity-80">
          MORPH 
        </span>
        {' '}
        <span 
          className="bg-gradient-to-r from-grid-accent-start via-grid-accent-mid to-grid-accent-end bg-clip-text text-transparent"
          style={{ 
            textShadow: '0 0 20px hsl(var(--grid-glow) / 0.4), 0 0 40px hsl(var(--grid-glow) / 0.2)',
            filter: 'drop-shadow(0 0 8px hsl(var(--grid-accent-mid) / 0.5))',
            letterSpacing: '0.15em'
          }}
        >
          GRID
        </span>
      </span>
    </button>
  );
};
