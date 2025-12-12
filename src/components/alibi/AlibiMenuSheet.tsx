import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { GamesNavigation } from '@/components/shared/GamesNavigation';
import { useAlibiSettings } from '@/hooks/useAlibiSettings';
import { Settings, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AlibiMenuSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AlibiMenuSheet({ open, onOpenChange }: AlibiMenuSheetProps) {
  const navigate = useNavigate();
  const { 
    showTimer, 
    setShowTimer, 
    autoDeduction, 
    setAutoDeduction 
  } = useAlibiSettings();
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);

  React.useEffect(() => {
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="left" 
        className="w-[300px] bg-alibi-page-bg border-alibi-divider"
      >
        <SheetHeader>
          <SheetTitle className="font-serif text-alibi-text-primary">
            Menu
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Games Navigation */}
          <GamesNavigation 
            currentGame="alibi" 
            onNavigate={() => onOpenChange(false)} 
          />

          {/* Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-alibi-text-secondary">
              <Settings className="h-4 w-4" />
              <span className="text-sm font-medium uppercase tracking-wide">
                Settings
              </span>
            </div>

            <div className="space-y-3 pl-6">
              <div className="flex items-center justify-between">
                <Label 
                  htmlFor="show-timer" 
                  className="text-sm text-alibi-text-primary"
                >
                  Show Timer
                </Label>
                <Switch
                  id="show-timer"
                  checked={showTimer}
                  onCheckedChange={setShowTimer}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label 
                  htmlFor="auto-deduction" 
                  className="text-sm text-alibi-text-primary"
                >
                  Auto-Deduction
                </Label>
                <Switch
                  id="auto-deduction"
                  checked={autoDeduction}
                  onCheckedChange={setAutoDeduction}
                />
              </div>
            </div>
          </div>

          {/* Account */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-alibi-text-secondary">
              <User className="h-4 w-4" />
              <span className="text-sm font-medium uppercase tracking-wide">
                Account
              </span>
            </div>

            <div className="pl-6">
              <Button
                variant="ghost"
                className="w-full justify-start text-alibi-text-primary hover:bg-alibi-divider/50"
                onClick={() => handleNavigate(isLoggedIn ? '/profile' : '/login')}
              >
                {isLoggedIn ? 'View Profile' : 'Sign In'}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
