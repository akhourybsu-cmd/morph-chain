import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { GamesNavigation } from '@/components/shared/GamesNavigation';
import { PrestigeThemeToggle } from '@/components/shared/PrestigeThemeToggle';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';

interface ClashMenuSheetProps {
  open: boolean;
  onClose: () => void;
}

export const ClashMenuSheet = ({ open, onClose }: ClashMenuSheetProps) => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setIsLoggedIn(!!data.session));
  }, []);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="left"
        className="w-72 p-0 border-r"
        style={{
          background: 'hsl(var(--clash-page-bg))',
          borderColor: 'hsl(var(--clash-card-border))',
        }}
      >
        <SheetHeader className="p-4 pb-2">
          <SheetTitle className="sr-only">Menu</SheetTitle>
        </SheetHeader>
        <div className="px-4 space-y-6">
          <GamesNavigation currentGame="clash" onNavigate={onClose} />
          
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 px-2" style={{ color: 'hsl(var(--clash-text-muted))' }}>
              Account
            </h3>
            <button
              onClick={() => { navigate(isLoggedIn ? '/profile' : '/login'); onClose(); }}
              className="w-full text-left px-3 py-2.5 rounded-lg transition-colors text-sm"
              style={{ color: 'hsl(var(--clash-text-primary))' }}
            >
              {isLoggedIn ? 'My Account' : 'Sign In'}
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
