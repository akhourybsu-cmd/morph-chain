import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Menu, HelpCircle, Sparkles, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { GamesNavigation } from "@/components/shared/GamesNavigation";
import { supabase } from "@/integrations/supabase/client";

interface MorphCodeMenuSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MorphCodeMenuSheet = ({ open, onOpenChange }: MorphCodeMenuSheetProps) => {
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-80 overflow-y-auto bg-[hsl(var(--code-card-bg))] border-[hsl(var(--code-card-border))]"
      >
        <div className="flex flex-col gap-6 mt-8 font-inter">
          <GamesNavigation currentGame="morphcode" onNavigate={() => onOpenChange(false)} />

          <Separator className="bg-[hsl(var(--code-divider))]" />

          <div>
            <h3 className="text-xs font-semibold text-[hsl(var(--code-text-muted))] mb-3 px-2 uppercase tracking-wider">Account</h3>
            <div className="space-y-1">
              <button
                onClick={() => { navigate(isLoggedIn ? '/profile' : '/login'); onOpenChange(false); }}
                className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-[hsl(var(--code-pill-bg))] transition-colors flex items-center gap-2 text-[hsl(var(--code-text-primary))]"
              >
                <User className="w-4 h-4 text-[hsl(var(--code-accent))]" />
                {isLoggedIn ? 'My Account' : 'Sign In'}
              </button>
            </div>
          </div>

          <Separator className="bg-[hsl(var(--code-divider))]" />

          <div>
            <h3 className="text-xs font-semibold text-[hsl(var(--code-text-muted))] mb-3 px-2 uppercase tracking-wider">Info</h3>
            <div className="space-y-1">
              <button
                onClick={() => { navigate("/rules"); onOpenChange(false); }}
                className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-[hsl(var(--code-pill-bg))] transition-colors flex items-center gap-2 text-[hsl(var(--code-text-primary))]"
              >
                <HelpCircle className="w-4 h-4 text-[hsl(var(--code-accent))]" />
                Rules
              </button>
              <button
                onClick={() => { navigate("/whats-new"); onOpenChange(false); }}
                className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-[hsl(var(--code-pill-bg))] transition-colors flex items-center gap-2 text-[hsl(var(--code-text-primary))]"
              >
                <Sparkles className="w-4 h-4 text-[hsl(var(--code-accent))]" />
                What's New
              </button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
