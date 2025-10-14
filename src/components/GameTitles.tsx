// Reusable styled title components for each Morph game

export const MorphChainTitle = ({ className = "" }: { className?: string }) => (
  <span 
    className={`font-outfit font-semibold tracking-tight bg-gradient-to-r from-chain to-chain bg-clip-text text-transparent whitespace-nowrap ${className}`}
    style={{ letterSpacing: '-0.02em' }}
  >
    MORPH CHAIN
  </span>
);

export const MorphArcadeTitle = ({ className = "" }: { className?: string }) => (
  <span 
    className={`font-outfit font-bold tracking-tight whitespace-nowrap ${className}`}
    style={{ letterSpacing: '-0.02em' }}
  >
    <span className="bg-gradient-to-r from-chain to-chain bg-clip-text text-transparent">MORPH CHAIN: </span>
    <span className="bg-gradient-to-r from-[#FF6B35] to-[#F7931E] bg-clip-text text-transparent" style={{ 
      textShadow: '0 0 20px rgba(255, 107, 53, 0.3)',
      fontFamily: 'Impact, "Arial Black", sans-serif',
      letterSpacing: '0.05em'
    }}>ARCADE</span>
  </span>
);

export const MorphPrismTitle = ({ className = "" }: { className?: string }) => (
  <span 
    className={`font-outfit font-semibold tracking-tight bg-gradient-to-r from-[hsl(var(--prism-accent-start))] via-[hsl(var(--prism-accent-mid))] to-[hsl(var(--prism-accent-end))] bg-clip-text text-transparent whitespace-nowrap ${className}`}
    style={{ letterSpacing: '-0.02em' }}
  >
    MORPH PRISM
  </span>
);

export const MorphRushTitle = ({ className = "" }: { className?: string }) => (
  <span 
    className={`font-outfit font-semibold tracking-tight whitespace-nowrap ${className}`}
    style={{ letterSpacing: '-0.02em', paddingRight: '0.25em' }}
  >
    <span className="bg-gradient-rush bg-clip-text text-transparent">MORPH </span>
    <span className="bg-gradient-rush bg-clip-text text-transparent italic">RUSH</span>
  </span>
);
