// Reusable styled title components for each Morph game

export const MorphChainTitle = ({ className = "" }: { className?: string }) => (
  <span 
    className={`font-outfit font-semibold tracking-tight bg-gradient-to-r from-chain to-chain bg-clip-text text-transparent whitespace-nowrap ${className}`}
    style={{ letterSpacing: '-0.02em' }}
  >
    MORPH CHAIN
  </span>
);

export const MorphPrismTitle = ({ className = "" }: { className?: string }) => (
  <span 
    className={`font-outfit font-semibold tracking-tight bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 bg-clip-text text-transparent whitespace-nowrap ${className}`}
    style={{ letterSpacing: '-0.02em' }}
  >
    MORPH PRISM
  </span>
);

export const MorphRushTitle = ({ className = "" }: { className?: string }) => (
  <span 
    className={`font-outfit font-semibold tracking-tight bg-gradient-rush bg-clip-text text-transparent whitespace-nowrap ${className}`}
    style={{ letterSpacing: '-0.02em', fontStyle: 'italic' }}
  >
    MORPH RUSH
  </span>
);
