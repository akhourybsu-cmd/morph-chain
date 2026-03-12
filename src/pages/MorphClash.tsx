import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeMatches, setActiveMatches] = useState<ClashMatchSummary[]>([]);
  const [completedMatches, setCompletedMatches] = useState<ClashMatchSummary[]>([]);
  const [opponentNames, setOpponentNames] = useState<Record<string, string>>({});
  const { match, userId, loading, setUserId, loadMatch, subscribeToMatch, clearMatch } = useClashStore();


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

    // Batch-fetch opponent display names
    const allMatches = [...active, ...completed];
    const currentUserId = userId;
    if (!currentUserId) return;
    const oppIds = new Set<string>();
    for (const m of allMatches) {
      const oppId = currentUserId === m.player_a ? m.player_b : m.player_a;
      if (oppId && oppId !== currentUserId) oppIds.add(oppId);
    }
    if (oppIds.size === 0) return;
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('user_id, display_name')
      .in('user_id', Array.from(oppIds));
    if (profiles) {
      const names: Record<string, string> = {};
      for (const p of profiles) {
        if (p.display_name) names[p.user_id] = p.display_name;
      }
      setOpponentNames(names);
    }
  };

  useEffect(() => {
    if (isLoggedIn && !match) {
      refreshMatchList();
    }
  }, [isLoggedIn, match]);

  const handleMatchFound = (matchId: string) => {
    loadMatch(matchId);
    subscribeToMatch(matchId);
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
  const showBoard = match && ['active', 'completed', 'waiting'].includes(match.status);
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
        {showLobby && (
          <>
            {(activeMatches.length > 0 || completedMatches.length > 0) && (
              <div className="mb-4">
                <ClashMatchList
                  matches={activeMatches}
                  completedMatches={completedMatches}
                  userId={userId}
                  opponentNames={opponentNames}
                  onSelectMatch={handleSelectMatch}
                  onMatchCancelled={refreshMatchList}
                />
              </div>
            )}

            <ClashLobby
              onMatchFound={handleMatchFound}
              isLoggedIn={isLoggedIn}
              onLoginRequired={() => navigate('/login')}
              onMatchCancelled={() => { clearMatch(); refreshMatchList(); }}
              onMatchCreated={(matchId) => {
                handleSelectMatch(matchId);
              }}
            />
          </>
        )}

      {/* Loading skeleton */}
        {!match && loading && (
          <div className="space-y-4 animate-pulse">
            <div className="rounded-xl h-28" style={{ background: 'hsl(var(--clash-card-bg))' }} />
            <div className="flex justify-center">
              <div className="grid grid-cols-5 gap-1.5">
                {Array.from({ length: 25 }).map((_, i) => (
                  <div key={i} className="rounded-xl" style={{ width: 'var(--clash-tile-size, 60px)', height: 'var(--clash-tile-size, 60px)', background: 'hsl(var(--clash-neutral))' }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {showBoard && (
          <div className="space-y-4">
            <ClashHUD />
            <ClashBoard isMyTurn={isMyTurn && match.status === 'active'} />
            {match.status === 'active' && <ClashActionBar isMyTurn={isMyTurn} />}
            {match.status === 'waiting' && (
              <div className="text-center">
                <button
                  onClick={() => { clearMatch(); refreshMatchList(); }}
                  className="text-xs font-inter px-4 py-2 rounded-lg transition-colors"
                  style={{ color: 'hsl(var(--clash-text-muted))' }}
                >
                  ← Back to lobby
                </button>
              </div>
            )}
            {match.status === 'completed' && <ClashResults />}
          </div>
        )}
      </main>

      <ClashMenuSheet open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
};

export default MorphClash;
