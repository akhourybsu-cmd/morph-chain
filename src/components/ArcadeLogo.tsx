import { useNavigate } from "react-router-dom";
import { MorphArcadeTitle } from "@/components/GameTitles";

export const ArcadeLogo = ({ className = "" }: { className?: string }) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/')}
      className={`flex items-center gap-1 hover:opacity-80 transition-opacity ${className}`}
      aria-label="Go to home"
    >
      <MorphArcadeTitle className="text-base sm:text-xl" />
    </button>
  );
};
