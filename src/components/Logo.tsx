import { useNavigate } from "react-router-dom";
import { MorphChainTitle } from "@/components/GameTitles";

export const Logo = ({ className = "" }: { className?: string }) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/')}
      className={`flex items-center gap-1 hover:opacity-80 transition-opacity ${className}`}
      aria-label="Go to home"
    >
      <MorphChainTitle className="text-base sm:text-xl" />
    </button>
  );
};
