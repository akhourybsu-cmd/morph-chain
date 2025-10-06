export const Logo = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <span 
        className="font-outfit font-semibold text-base sm:text-xl tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent whitespace-nowrap"
        style={{ letterSpacing: '-0.02em' }}
      >
        MORPH CHAIN
      </span>
    </div>
  );
};
