import { useEffect, useState } from "react";
import { CHAIN_ACHIEVEMENTS } from "@/lib/chainAchievements";

interface ChainAchievementPopupProps {
  achievementId: string;
  onComplete: () => void;
}

export const ChainAchievementPopup = ({ achievementId, onComplete }: ChainAchievementPopupProps) => {
  const [show, setShow] = useState(true);
  const achievement = CHAIN_ACHIEVEMENTS[achievementId];
  
  useEffect(() => {
    const timeout = setTimeout(() => {
      setShow(false);
      setTimeout(onComplete, 400);
    }, 2000);
    
    return () => clearTimeout(timeout);
  }, [onComplete]);
  
  if (!achievement) return null;
  
  return (
    <div 
      className={`
        fixed top-1/3 left-1/2 -translate-x-1/2 z-50
        px-6 py-4 rounded-2xl
        bg-card border-2 border-primary
        shadow-2xl
        transition-all duration-400
        ${show ? 'opacity-100 scale-100 animate-scale-in' : 'opacity-0 scale-95'}
      `}
      style={{
        boxShadow: '0 0 40px hsl(var(--primary) / 0.4), 0 8px 24px hsl(var(--background))',
      }}
    >
      {/* Sparkle particles */}
      {show && (
        <>
          <div className="absolute -top-2 -left-2 text-2xl animate-pulse" style={{ animationDelay: '0s' }}>✨</div>
          <div className="absolute -top-2 -right-2 text-2xl animate-pulse" style={{ animationDelay: '0.1s' }}>✨</div>
          <div className="absolute -bottom-2 left-1/2 text-2xl animate-pulse" style={{ animationDelay: '0.2s' }}>✨</div>
        </>
      )}
      
      <div className="flex items-center gap-3">
        <span className="text-4xl">{achievement.icon}</span>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Achievement Unlocked!</p>
          <p className="text-lg font-semibold text-primary">{achievement.title}</p>
          <p className="text-sm text-muted-foreground">{achievement.flavorText}</p>
        </div>
      </div>
    </div>
  );
};
