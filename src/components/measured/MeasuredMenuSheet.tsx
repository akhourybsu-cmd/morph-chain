import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { GamesNavigation } from '@/components/shared/GamesNavigation';
import { User, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MeasuredMenuSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatsClick?: () => void;
}

export function MeasuredMenuSheet({ open, onOpenChange, onStatsClick }: MeasuredMenuSheetProps) {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleNavigate = (path: string) => {
    navigate(path);
    onOpenChange(false);
  };

  const handleStatsClick = () => {
    onOpenChange(false);
    onStatsClick?.();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="left" 
        className="w-80 overflow-y-auto bg-measured-card border-measured-card-border"
      >
        <SheetHeader>
          <SheetTitle className="font-playfair text-measured-text-primary">
            Menu
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-5 py-4">
          {/* Games Section */}
          <GamesNavigation currentGame="measured" onNavigate={() => onOpenChange(false)} />

          <Separator className="bg-measured-card-border" />

          {/* Stats Section */}
          {onStatsClick && (
            <>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 px-2 text-measured-text-muted">
                  Statistics
                </h3>
                <div className="space-y-1">
                  <button
                    onClick={handleStatsClick}
                    className="w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-2 text-measured-text-primary hover:bg-measured-page"
                  >
                    <BarChart3 className="w-4 h-4 text-measured-accent" />
                    <span className="text-sm">View Stats</span>
                  </button>
                </div>
              </div>
              <Separator className="bg-measured-card-border" />
            </>
          )}

          {/* Account Section */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 px-2 text-measured-text-muted">
              Account
            </h3>
            <div className="space-y-1">
              <button
                onClick={() => handleNavigate(isLoggedIn ? '/profile' : '/login')}
                className="w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-2 text-measured-text-primary hover:bg-measured-page"
              >
                <User className="w-4 h-4 text-measured-accent" />
                <span className="text-sm">{isLoggedIn ? 'My Account' : 'Sign In'}</span>
              </button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
