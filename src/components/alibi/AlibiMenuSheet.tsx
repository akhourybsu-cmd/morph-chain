import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { GamesNavigation } from '@/components/shared/GamesNavigation';
import { useAlibiSettings } from '@/hooks/useAlibiSettings';
import { Settings, User, ChevronDown, HelpCircle, Sparkles } from 'lucide-react';
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="left" 
        className="w-80 overflow-y-auto"
        style={{
          background: 'hsl(var(--alibi-card-bg))',
          borderColor: 'hsl(var(--alibi-card-border))',
        }}
      >
        <SheetHeader>
          <SheetTitle 
            className="font-serif"
            style={{ color: 'hsl(var(--alibi-text-primary))' }}
          >
            Menu
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-5 py-4">
          {/* Games Section */}
          <GamesNavigation currentGame="alibi" onNavigate={() => onOpenChange(false)} />

          <Separator style={{ background: 'hsl(var(--alibi-divider))' }} />

          {/* Account Section */}
          <div>
            <h3 
              className="text-xs font-semibold uppercase tracking-wider mb-3 px-2"
              style={{ color: 'hsl(var(--alibi-text-muted))' }}
            >
              Account
            </h3>
            <div className="space-y-1">
              <button
                onClick={() => handleNavigate(isLoggedIn ? '/profile' : '/login')}
                className="w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-2"
                style={{ color: 'hsl(var(--alibi-text-primary))' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'hsl(var(--alibi-divider))'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <User className="w-4 h-4" style={{ color: 'hsl(var(--alibi-accent))' }} />
                <span className="text-sm">{isLoggedIn ? 'My Account' : 'Sign In'}</span>
              </button>
            </div>
          </div>

          <Separator style={{ background: 'hsl(var(--alibi-divider))' }} />

          {/* Settings Section - Collapsible */}
          <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
            <CollapsibleTrigger 
              className="flex items-center justify-between w-full px-2 py-1.5 rounded-lg transition-colors"
              style={{ color: 'hsl(var(--alibi-text-primary))' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'hsl(var(--alibi-divider))'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" style={{ color: 'hsl(var(--alibi-text-muted))' }} />
                <span className="font-medium text-sm">Settings</span>
              </div>
              <ChevronDown 
                className={`h-4 w-4 transition-transform ${settingsOpen ? 'rotate-180' : ''}`} 
                style={{ color: 'hsl(var(--alibi-text-muted))' }}
              />
            </CollapsibleTrigger>
            
            <CollapsibleContent className="space-y-4 pt-4">
              <div className="flex items-center justify-between px-2">
                <div className="space-y-0.5">
                  <Label 
                    htmlFor="show-timer" 
                    className="text-sm"
                    style={{ color: 'hsl(var(--alibi-text-primary))' }}
                  >
                    Show Timer
                  </Label>
                  <p 
                    className="text-xs"
                    style={{ color: 'hsl(var(--alibi-text-muted))' }}
                  >
                    Display elapsed time
                  </p>
                </div>
                <Switch
                  id="show-timer"
                  checked={showTimer}
                  onCheckedChange={setShowTimer}
                />
              </div>

              <div className="flex items-center justify-between px-2">
                <div className="space-y-0.5">
                  <Label 
                    htmlFor="auto-deduction" 
                    className="text-sm"
                    style={{ color: 'hsl(var(--alibi-text-primary))' }}
                  >
                    Auto-Deduction
                  </Label>
                  <p 
                    className="text-xs"
                    style={{ color: 'hsl(var(--alibi-text-muted))' }}
                  >
                    Auto-fill forced cells
                  </p>
                </div>
                <Switch
                  id="auto-deduction"
                  checked={autoDeduction}
                  onCheckedChange={setAutoDeduction}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </SheetContent>
    </Sheet>
  );
}