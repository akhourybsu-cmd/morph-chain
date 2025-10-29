import { useEffect, useState } from "react";
import { ACHIEVEMENTS } from "@/lib/rushAchievements";

interface AchievementPopupProps {
  achievementId: string;
  onComplete: () => void;
}

export const AchievementPopup = ({ achievementId, onComplete }: AchievementPopupProps) => {
  const [show, setShow] = useState(true);
  const achievement = ACHIEVEMENTS[achievementId];
  
  useEffect(() => {
    // Fade out after 1.2s
    const timeout = setTimeout(() => {
      setShow(false);
      // Call onComplete after fade animation
      setTimeout(onComplete, 400);
    }, 1200);
    
    return () => clearTimeout(timeout);
  }, [onComplete]);
  
  if (!achievement) return null;
  
  return (
    <div 
      className={`
        fixed top-1/3 left-1/2 -translate-x-1/2 z-50
        px-6 py-4 rounded-2xl
        bg-card border-2 border-rush-orange
        shadow-2xl
        transition-all duration-400
        ${show ? 'opacity-100 scale-100 animate-achievement-pop' : 'opacity-0 scale-95'}
      `}
      style={{
        boxShadow: '0 0 40px hsl(var(--rush-orange) / 0.4), 0 8px 24px hsl(var(--background))',
      }}
    >
      {/* Sparkle particles */}
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
          <p className="text-sm font-semibold text-rush-orange">{achievement.title}</p>
          <p className="text-xs text-muted-foreground">{achievement.flavorText}</p>
        </div>
      </div>
    </div>
  );
};
