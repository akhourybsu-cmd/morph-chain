import { useState, useEffect } from 'react';
import { Users, Check } from 'lucide-react';
import { postActivity } from '@/lib/social/activityService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ShareToFriendsButtonProps {
  game: string;
  payload: Record<string, any>;
  /** CSS color for the icon/text accent */
  accentVar?: string;
  className?: string;
}

export const ShareToFriendsButton = ({
  game,
  payload,
  accentVar = '--home-accent',
  className = '',
}: ShareToFriendsButtonProps) => {
  const { toast } = useToast();
  const [shared, setShared] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setIsLoggedIn(!!data.session));
  }, []);

  if (!isLoggedIn) return null;

  const handleShare = async () => {
    if (shared) return;
    const success = await postActivity(game, 'score', payload);
    if (success) {
      setShared(true);
      toast({ title: 'Shared with friends!' });
    } else {
      toast({ title: 'Failed to share', variant: 'destructive' });
    }
  };

  return (
    <button
      onClick={handleShare}
      disabled={shared}
      className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
        shared ? 'opacity-60' : 'hover:opacity-80 active:scale-[0.98]'
      } ${className}`}
      style={{
        background: `hsl(${accentVar.startsWith('--') ? `var(${accentVar})` : accentVar} / 0.1)`,
        color: `hsl(${accentVar.startsWith('--') ? `var(${accentVar})` : accentVar})`,
      }}
    >
      {shared ? (
        <>
          <Check className="w-4 h-4" />
          Shared!
        </>
      ) : (
        <>
          <Users className="w-4 h-4" />
          Share with Friends
        </>
      )}
    </button>
  );
};
