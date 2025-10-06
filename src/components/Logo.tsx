import morphChainLogo from "@/assets/morph-chain-logo.png";

export const Logo = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <img 
        src={morphChainLogo} 
        alt="Morph Chain" 
        className="h-8 w-auto"
      />
    </div>
  );
};
