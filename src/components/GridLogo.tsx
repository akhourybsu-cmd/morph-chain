import { useNavigate } from "react-router-dom";
import morphGridLogo from "@/assets/morph-grid-logo.png";

export const GridLogo = ({ className = "" }: { className?: string }) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/')}
      className={`flex items-center hover:opacity-80 transition-opacity ${className}`}
      aria-label="Go to home"
    >
      <img 
        src={morphGridLogo} 
        alt="Morph Grid" 
        className="h-8 sm:h-10 w-auto object-contain"
      />
    </button>
  );
};
