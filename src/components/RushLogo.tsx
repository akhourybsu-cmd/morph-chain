import { useNavigate } from "react-router-dom";
import { MorphRushTitle } from "@/components/GameTitles";

export const RushLogo = ({ className = "" }: { className?: string }) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/')}
      className={`flex items-center gap-1 hover:opacity-80 transition-opacity ${className}`}
      aria-label="Go to home"
    >
      <MorphRushTitle className="text-base sm:text-xl" />
    </button>
  );
};
