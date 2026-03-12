import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { GamesNavigation } from '@/components/shared/GamesNavigation';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { User, HelpCircle, Sparkles } from 'lucide-react';

interface ClashMenuSheetProps {
  open: boolean;
  onClose: () => void;
}

export const ClashMenuSheet = ({ open, onClose }: ClashMenuSheetProps) => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setIsLoggedIn(!!data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsLoggedIn(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="left"
        className="w-80 overflow-y-auto"
        style={{
          background: 'hsl(var(--clash-page-bg))',
          borderColor: 'hsl(var(--clash-card-border))',
        }}
      >
        <SheetHeader>
          <SheetTitle 
            className="font-serif"
            style={{ color: 'hsl(var(--clash-text-primary))' }}
          >
            Menu
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-5 py-4">
          <GamesNavigation currentGame="clash" onNavigate={onClose} />

          <Separator style={{ background: 'hsl(var(--clash-card-border))' }} />

          {/* Account Section */}
          <div>
            <h3 
              className="text-xs font-semibold uppercase tracking-wider mb-3 px-2"
              style={{ color: 'hsl(var(--clash-text-muted))' }}
            >
              Account
            </h3>
            <div className="space-y-1">
              <button
                onClick={() => { navigate(isLoggedIn ? '/profile' : '/login'); onClose(); }}
                className="w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-2 text-sm"
                style={{ color: 'hsl(var(--clash-text-primary))' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'hsl(var(--clash-card-border))'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <User className="w-4 h-4" style={{ color: 'hsl(var(--clash-accent))' }} />
                {isLoggedIn ? 'My Account' : 'Sign In'}
              </button>
            </div>
          </div>

          <Separator style={{ background: 'hsl(var(--clash-card-border))' }} />

          {/* Info Section */}
          <div>
            <h3 
              className="text-xs font-semibold uppercase tracking-wider mb-3 px-2"
              style={{ color: 'hsl(var(--clash-text-muted))' }}
            >
              Info
            </h3>
            <div className="space-y-1">
              <button
                onClick={() => { navigate('/rules'); onClose(); }}
                className="w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-2 text-sm"
                style={{ color: 'hsl(var(--clash-text-primary))' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'hsl(var(--clash-card-border))'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <HelpCircle className="w-4 h-4" style={{ color: 'hsl(var(--clash-accent))' }} />
                Rules
              </button>
              <button
                onClick={() => { navigate('/whats-new'); onClose(); }}
                className="w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-2 text-sm"
                style={{ color: 'hsl(var(--clash-text-primary))' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'hsl(var(--clash-card-border))'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <Sparkles className="w-4 h-4" style={{ color: 'hsl(var(--clash-accent))' }} />
                What's New
              </button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
