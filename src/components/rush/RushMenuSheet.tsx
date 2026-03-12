import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Settings, Award, User, HelpCircle, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { GamesNavigation } from "@/components/shared/GamesNavigation";
import { AchievementGallery } from "@/components/chain/AchievementGallery";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface RushMenuSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenSettings: () => void;
}

export const RushMenuSheet = ({
  open,
  onOpenChange,
  onOpenSettings,
}: RushMenuSheetProps) => {
  const [showAchievements, setShowAchievements] = useState(false);
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session);
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsLoggedIn(!!session);
    });
    
    return () => subscription.unsubscribe();
  }, []);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent 
          side="left" 
          className="w-80 overflow-y-auto"
          style={{
            background: 'hsl(var(--rush-card-bg))',
            borderColor: 'hsl(var(--rush-card-border))',
          }}
        >
          <SheetHeader>
            <SheetTitle 
              className="font-serif"
              style={{ color: 'hsl(var(--rush-text-primary))' }}
            >
              Menu
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-5 py-4">
            {/* Games Section */}
            <GamesNavigation currentGame="rush" onNavigate={() => onOpenChange(false)} />

            <Separator style={{ background: 'hsl(var(--rush-divider))' }} />

            {/* Account Section */}
            <div>
              <h3 
                className="text-xs font-semibold uppercase tracking-wider mb-3 px-2"
                style={{ color: 'hsl(var(--rush-text-muted))' }}
              >
                Account
              </h3>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    navigate(isLoggedIn ? '/profile' : '/login');
                    onOpenChange(false);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-2"
                  style={{ color: 'hsl(var(--rush-text-primary))' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'hsl(var(--rush-divider))'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <User className="w-4 h-4" style={{ color: 'hsl(var(--rush-accent))' }} />
                  <span className="text-sm">{isLoggedIn ? 'My Account' : 'Sign In'}</span>
                </button>
              </div>
            </div>

            <Separator style={{ background: 'hsl(var(--rush-divider))' }} />

            {/* Rush-specific section */}
            <div>
              <h3 
                className="text-xs font-semibold uppercase tracking-wider mb-3 px-2"
                style={{ color: 'hsl(var(--rush-text-muted))' }}
              >
                Morph Rush
              </h3>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setShowAchievements(true);
                    onOpenChange(false);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-2"
                  style={{ color: 'hsl(var(--rush-text-primary))' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'hsl(var(--rush-divider))'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <Award className="w-4 h-4" style={{ color: 'hsl(var(--rush-accent))' }} />
                  <span className="text-sm">Achievements</span>
                </button>
                <button
                  onClick={() => {
                    onOpenSettings();
                    onOpenChange(false);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-2"
                  style={{ color: 'hsl(var(--rush-text-primary))' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'hsl(var(--rush-divider))'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <Settings className="w-4 h-4" style={{ color: 'hsl(var(--rush-text-muted))' }} />
                  <span className="text-sm">Settings & Leaderboard</span>
                </button>
            </div>
          </div>

          <Separator style={{ background: 'hsl(var(--rush-divider))' }} />

          {/* Info Section */}
          <div>
            <h3 
              className="text-xs font-semibold uppercase tracking-wider mb-3 px-2"
              style={{ color: 'hsl(var(--rush-text-muted))' }}
            >
              Info
            </h3>
            <div className="space-y-1">
              <button
                onClick={() => { navigate('/rules'); onOpenChange(false); }}
                className="w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-2"
                style={{ color: 'hsl(var(--rush-text-primary))' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'hsl(var(--rush-divider))'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <HelpCircle className="w-4 h-4" style={{ color: 'hsl(var(--rush-accent))' }} />
                <span className="text-sm">Rules</span>
              </button>
              <button
                onClick={() => { navigate('/whats-new'); onOpenChange(false); }}
                className="w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-2"
                style={{ color: 'hsl(var(--rush-text-primary))' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'hsl(var(--rush-divider))'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <Sparkles className="w-4 h-4" style={{ color: 'hsl(var(--rush-accent))' }} />
                <span className="text-sm">What's New</span>
              </button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>

      {/* Achievements Modal */}
      <AchievementGallery 
        open={showAchievements} 
        onOpenChange={setShowAchievements} 
      />
    </>
  );
};
