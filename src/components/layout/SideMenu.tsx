import { X, User, Users } from "lucide-react";
import { GamesNavigation } from "@/components/shared/GamesNavigation";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getFriends } from "@/lib/social/friendsService";

export function SideMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
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

  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
        onClick={onClose} 
      />
      <aside 
        className="absolute left-0 top-0 h-full w-80 p-4 overflow-y-auto"
        style={{ 
          background: 'hsl(var(--home-card-bg))',
          borderRight: '1px solid hsl(var(--home-card-border))'
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 
            className="font-serif font-semibold"
            style={{ color: 'hsl(var(--home-text-primary))' }}
          >
            Menu
          </h2>
          <button 
            onClick={onClose} 
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'hsl(var(--home-text-muted))' }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'hsl(var(--home-divider))'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-5">
          <GamesNavigation currentGame="chain" onNavigate={onClose} />
          
          <Separator style={{ background: 'hsl(var(--home-divider))' }} />
          
          {/* Account Section */}
          <div>
            <h3 
              className="text-xs font-semibold uppercase tracking-wider mb-3 px-2"
              style={{ color: 'hsl(var(--home-text-muted))' }}
            >
              Account
            </h3>
            <button
              onClick={() => {
                navigate(isLoggedIn ? '/profile' : '/login');
                onClose();
              }}
              className="w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-2"
              style={{ color: 'hsl(var(--home-text-primary))' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'hsl(var(--home-divider))'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <User className="w-4 h-4" style={{ color: 'hsl(var(--home-accent))' }} />
              <span className="text-sm">{isLoggedIn ? 'My Account' : 'Sign In'}</span>
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}