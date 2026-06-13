import { useEffect, useState } from "react";
import { GRID_ACHIEVEMENTS } from "@/lib/gridAchievements";

interface GridAchievementPopupProps {
  achievementId: string;
  onComplete: () => void;
}

export const GridAchievementPopup = ({ achievementId, onComplete }: GridAchievementPopupProps) => {
  const [exiting, setExiting] = useState(false);
  const achievement = GRID_ACHIEVEMENTS[achievementId];

  useEffect(() => {
    const exitTimer = setTimeout(() => setExiting(true), 1600);
    const doneTimer = setTimeout(() => onComplete(), 2000);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  if (!achievement) return null;

  return (
    // Positioned just below the info strip (header 56px + strip 40px = 96px = top-24).
    // Uses absolute so it stays within the max-w-xl game column, not the full viewport.
    <div
      className={[
        // Layout: anchor below info strip, centered horizontally.
        // -translate-x-1/2 keeps it centered during exit; the entry keyframe
        // also includes translateX(-50%) so it stays centered throughout.
        "absolute top-24 left-1/2 -translate-x-1/2 z-50",
        "w-max max-w-[calc(100%-2rem)]",
        // Card style
        "px-5 py-3.5 rounded-xl",
        "bg-[hsl(var(--grid-card-bg))] border border-[hsl(var(--grid-accent)/0.45)]",
        "shadow-xl",
        // Entry vs exit animation
        exiting
          ? "transition-all duration-[360ms] ease-in opacity-0 -translate-y-3"
          : "animate-achievement-slide-down",
      ].join(" ")}
      style={{
        boxShadow: "0 0 32px hsl(var(--grid-accent) / 0.2), 0 6px 20px rgba(0,0,0,0.12)",
      }}
    >
      {/* Confetti — anchored to the card corners */}
      <div className="absolute -top-2 -left-2 text-xl animate-confetti" style={{ animationDelay: "0s" }}>✨</div>
      <div className="absolute -top-2 -right-2 text-xl animate-confetti" style={{ animationDelay: "0.12s" }}>✨</div>

      <div className="flex items-center gap-3">
        <span className="text-2xl">{achievement.icon}</span>
        <div>
          <p className="text-sm font-semibold text-[hsl(var(--grid-accent))] leading-tight">
            {achievement.title}
          </p>
          <p className="text-xs text-[hsl(var(--grid-text-muted))] mt-0.5">
            {achievement.flavorText}
          </p>
        </div>
      </div>
    </div>
  );
};
