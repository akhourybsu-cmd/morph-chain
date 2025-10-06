export const PrismLogo = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <span 
        className="font-outfit font-semibold text-base sm:text-xl tracking-tight bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 bg-clip-text text-transparent whitespace-nowrap"
        style={{ letterSpacing: '-0.02em' }}
      >
        MORPH PRISM
      </span>
    </div>
  );
};
