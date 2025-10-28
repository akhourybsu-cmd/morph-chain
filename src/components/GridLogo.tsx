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
        <span className="bg-gradient-to-r from-chain to-chain bg-clip-text text-transparent">
          MORPH 
        </span>
        {' '}
        <span className="bg-gradient-to-r from-grid-accent-start to-grid-accent-end bg-clip-text text-transparent">
          GRID
        </span>
      </span>
    </button>
  );
};
