import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Menu, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useClashStore } from '@/stores/clashStore';
import { getMyActiveClashMatch, getMyRecentCompletedMatch } from '@/lib/clash/matchService';
import { ClashLogo } from '@/components/clash/ClashLogo';
import { ClashLobby } from '@/components/clash/ClashLobby';
import { ClashBoard } from '@/components/clash/ClashBoard';
import { ClashHUD } from '@/components/clash/ClashHUD';
import { ClashResults } from '@/components/clash/ClashResults';
import { ClashActionBar } from '@/components/clash/ClashActionBar';
import { ClashMenuSheet } from '@/components/clash/ClashMenuSheet';
import { PrestigeThemeToggle } from '@/components/shared/PrestigeThemeToggle';

const MorphClash = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { match, userId, setUserId, loadMatch, subscribeToMatch, clearMatch } = useClashStore();

  // Read ?join=CODE from URL
  const joinCode = searchParams.get('join');

  // Clear join param after consuming it
  useEffect(() => {
    if (joinCode && match) {
      setSearchParams({}, { replace: true });
    }
  }, [joinCode, match, setSearchParams]);

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session);
      setUserId(data.session?.user.id ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsLoggedIn(!!session);
      setUserId(session?.user.id ?? null);
    });
    return () => subscription.unsubscribe();
  }, [setUserId]);

  // Auto-load active match
  useEffect(() => {
    if (!isLoggedIn || match) return;
    (async () => {
      const activeId = await getMyActiveClashMatch();
      if (activeId) {
        loadMatch(activeId);
        subscribeToMatch(activeId);
        return;
      }
      const recentId = await getMyRecentCompletedMatch();
      if (recentId) {
        loadMatch(recentId);
      }
    })();
  }, [isLoggedIn, match, loadMatch, subscribeToMatch]);

  const handleMatchFound = (matchId: string) => {
    loadMatch(matchId);
    subscribeToMatch(matchId);
    // Clear join param
    if (joinCode) setSearchParams({}, { replace: true });
  };

  const isMyTurn = match?.current_turn === userId;
  const showLobby = !match || match.status === 'expired';
  const showBoard = match && (match.status === 'active' || match.status === 'completed');
  const showWaiting = match?.status === 'waiting';

  // Calculate tile size based on viewport
  useEffect(() => {
    const updateSize = () => {
      const vw = window.innerWidth;
      const maxGridWidth = Math.min(vw - 48, 340);
      const tileSize = Math.floor((maxGridWidth - 4 * 6) / 5);
      document.documentElement.style.setProperty('--clash-tile-size', `${tileSize}px`);
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'hsl(var(--clash-page-bg))' }}
    >
      {/* Header */}
      <header
        className="h-14 flex items-center justify-between px-4"
        style={{ borderBottom: '1px solid hsl(var(--clash-card-border))' }}
      >
        <div className="flex items-center gap-1 flex-1">
          <button
            onClick={() => setMenuOpen(true)}
            className="p-1.5 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/10"
          >
            <Menu className="w-5 h-5" style={{ color: 'hsl(var(--clash-text-muted))' }} />
          </button>
          <PrestigeThemeToggle colorVar="--clash-text-muted" />
        </div>

        <ClashLogo />

        <div className="flex items-center gap-1 flex-1 justify-end">
          <button
            onClick={() => navigate(isLoggedIn ? '/profile' : '/login')}
            className="p-1.5 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/10"
          >
            <User className="w-5 h-5" style={{ color: 'hsl(var(--clash-text-muted))' }} />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container mx-auto px-4 py-4 max-w-md overflow-y-auto">
        {showLobby && (
          <ClashLobby
            onMatchFound={handleMatchFound}
            isLoggedIn={isLoggedIn}
            onLoginRequired={() => navigate('/login')}
            existingInviteCode={showWaiting ? match?.invite_code : null}
            existingMatchId={showWaiting ? match?.id : null}
            onMatchCancelled={clearMatch}
            initialJoinCode={joinCode}
          />
        )}

        {showWaiting && (
          <ClashLobby
            onMatchFound={handleMatchFound}
            isLoggedIn={isLoggedIn}
            onLoginRequired={() => navigate('/login')}
            existingInviteCode={match?.invite_code}
            existingMatchId={match?.id}
            onMatchCancelled={clearMatch}
            initialJoinCode={null}
          />
        )}

        {showBoard && (
          <div className="space-y-4">
            <ClashHUD />
            <ClashBoard isMyTurn={isMyTurn && match.status === 'active'} />
            {match.status === 'active' && <ClashActionBar isMyTurn={isMyTurn} />}
            {match.status === 'completed' && <ClashResults />}
          </div>
        )}
      </main>

      <ClashMenuSheet open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
};

export default MorphClash;
