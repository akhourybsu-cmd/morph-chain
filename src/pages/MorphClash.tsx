import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Menu, User, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useClashStore } from '@/stores/clashStore';
import { getMyActiveClashMatches, getMyRecentCompletedMatches, type ClashMatchSummary } from '@/lib/clash/matchService';
import { ClashLogo } from '@/components/clash/ClashLogo';
import { ClashLobby } from '@/components/clash/ClashLobby';
import { ClashMatchList } from '@/components/clash/ClashMatchList';
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
  const [activeMatches, setActiveMatches] = useState<ClashMatchSummary[]>([]);
  const [completedMatches, setCompletedMatches] = useState<ClashMatchSummary[]>([]);
  const { match, userId, setUserId, loadMatch, subscribeToMatch, clearMatch } = useClashStore();

  const joinCode = searchParams.get('join');

  // Clear join param after consuming
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

  // Load all active matches for the lobby
  const refreshMatchList = async () => {
    if (!isLoggedIn) return;
    const [active, completed] = await Promise.all([
      getMyActiveClashMatches(),
      getMyRecentCompletedMatches(),
    ]);
    setActiveMatches(active);
    setCompletedMatches(completed);
  };

  useEffect(() => {
    if (isLoggedIn && !match) {
      refreshMatchList();
    }
  }, [isLoggedIn, match]);

  const handleMatchFound = (matchId: string) => {
    loadMatch(matchId);
    subscribeToMatch(matchId);
    if (joinCode) setSearchParams({}, { replace: true });
  };

  const handleSelectMatch = (matchId: string) => {
    loadMatch(matchId);
    subscribeToMatch(matchId);
  };

  const handleBackToLobby = () => {
    clearMatch();
    refreshMatchList();
  };

  const isMyTurn = match?.current_turn === userId;
  const showBoard = match && (match.status === 'active' || match.status === 'completed');
  const showWaiting = match?.status === 'waiting';
  const showLobby = !match || match.status === 'expired';

  // Tile size
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
    <div className="min-h-screen flex flex-col" style={{ background: 'hsl(var(--clash-page-bg))' }}>
      {/* Header */}
      <header
        className="h-14 flex items-center justify-between px-4"
        style={{ borderBottom: '1px solid hsl(var(--clash-card-border))' }}
      >
        <div className="flex items-center gap-1 flex-1">
          {match ? (
            <button
              onClick={handleBackToLobby}
              className="p-1.5 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5" style={{ color: 'hsl(var(--clash-text-muted))' }} />
            </button>
          ) : (
            <button
              onClick={() => setMenuOpen(true)}
              className="p-1.5 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/10"
            >
              <Menu className="w-5 h-5" style={{ color: 'hsl(var(--clash-text-muted))' }} />
            </button>
          )}
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
        {(showLobby || showWaiting) && (
          <>
            {/* Active matches list */}
            {!showWaiting && (activeMatches.length > 0 || completedMatches.length > 0) && (
              <div className="mb-4">
                <ClashMatchList
                  matches={activeMatches}
                  completedMatches={completedMatches}
                  userId={userId}
                  onSelectMatch={handleSelectMatch}
                />
              </div>
            )}

            <ClashLobby
              onMatchFound={handleMatchFound}
              isLoggedIn={isLoggedIn}
              onLoginRequired={() => navigate('/login')}
              existingInviteCode={showWaiting ? match?.invite_code : null}
              existingMatchId={showWaiting ? match?.id : null}
              onMatchCancelled={() => { clearMatch(); refreshMatchList(); }}
              initialJoinCode={joinCode}
            />
          </>
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
