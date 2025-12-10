import { useEffect, useState } from "react";
import { GRID_ACHIEVEMENTS } from "@/lib/gridAchievements";

interface GridAchievementPopupProps {
  achievementId: string;
  onComplete: () => void;
}

export const GridAchievementPopup = ({ achievementId, onComplete }: GridAchievementPopupProps) => {
  const [show, setShow] = useState(true);
  const achievement = GRID_ACHIEVEMENTS[achievementId];
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      setShow(false);
      setTimeout(onComplete, 400);
    }, 1500);
    
    return () => clearTimeout(timeout);
  }, [onComplete]);
  
  if (!achievement) return null;
  
  return (
    <div 
      className={`
        fixed top-1/3 left-1/2 -translate-x-1/2 z-50
        px-6 py-4 rounded-2xl
        bg-[hsl(var(--grid-card-bg))] border-2 border-[hsl(var(--grid-accent))]
        shadow-2xl
        transition-all duration-400
        ${show ? 'opacity-100 scale-100 animate-achievement-pop' : 'opacity-0 scale-95'}
      `}
      style={{
        boxShadow: '0 0 40px hsl(var(--grid-accent) / 0.3), 0 8px 24px rgba(0,0,0,0.15)',
      }}
    >
      {show && (
        <>
          <div className="absolute -top-2 -left-2 text-2xl animate-confetti" style={{ animationDelay: '0s' }}>✨</div>
          <div className="absolute -top-2 -right-2 text-2xl animate-confetti" style={{ animationDelay: '0.1s' }}>✨</div>
          <div className="absolute -bottom-2 left-1/2 text-2xl animate-confetti" style={{ animationDelay: '0.2s' }}>✨</div>
        </>
      )}
      
      <div className="flex items-center gap-3">
        <span className="text-3xl">{achievement.icon}</span>
        <div>
          <p className="text-sm font-semibold text-[hsl(var(--grid-accent))]">{achievement.title}</p>
          <p className="text-xs text-[hsl(var(--grid-text-muted))]">{achievement.flavorText}</p>
        </div>
      </div>
    </div>
  );
};
