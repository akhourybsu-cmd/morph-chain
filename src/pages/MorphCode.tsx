import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MorphcodeHeader } from '@/components/morphcode/MorphcodeHeader';
import { MorphcodeLobby } from '@/components/morphcode/MorphcodeLobby';
import { SequenceBuilder } from '@/components/morphcode/SequenceBuilder';
import { GuessBoard } from '@/components/morphcode/GuessBoard';
import { MatchScoreBar } from '@/components/morphcode/MatchScoreBar';
import { RoundResults } from '@/components/morphcode/RoundResults';
import { VersusScreen } from '@/components/morphcode/VersusScreen';
import { XPBar } from '@/components/morphcode/XPBar';
import {
  getActiveMatch, getCurrentRound, lockSequence, submitGuess,
  createNextRound, cancelMatch, getPlayerStats, getPlayerDisplayName,
  getOpponentSequence, createRematch, MorphcodePlayerStats,
} from '@/lib/morphcode/matchService';
import { updatePresence, setOffline } from '@/lib/social/friendsService';
import { MatchState, RoundState, Symbol } from '@/lib/morphcode/types';
import { toast } from 'sonner';
import { initMorphcodeAudio, playCodeSolved } from '@/lib/morphcode/audioManager';

type GamePhase = 'lobby' | 'waiting' | 'versus' | 'setup' | 'playing' | 'round-end' | 'match-end';

interface VersusData {
  playerA: { displayName: string; record: { wins: number; losses: number; draws: number } };
  playerB: { displayName: string; record: { wins: number; losses: number; draws: number } };
}

const MorphCode = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [phase, setPhase] = useState<GamePhase>('lobby');
  const [match, setMatch] = useState<MatchState | null>(null);
  const [round, setRound] = useState<RoundState | null>(null);
  const [loading, setLoading] = useState(true);
  const [versusData, setVersusData] = useState<VersusData | null>(null);
  const [oppSequence, setOppSequence] = useState<Symbol[] | null>(null);
  const hasShownVersusRef = useRef(false);
  const statsRefreshedRef = useRef<string | null>(null);
  const loadingRef = useRef(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [myStats, setMyStats] = useState<MorphcodePlayerStats | null>(null);

  useEffect(() => {
    initMorphcodeAudio();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null);
      if (user?.id) getPlayerStats(user.id).then(setMyStats);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id || null);
      if (session?.user?.id) getPlayerStats(session.user.id).then(setMyStats);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Presence heartbeat
  useEffect(() => {
    if (!userId) return;
    updatePresence();
    const interval = setInterval(updatePresence, 30000);
    return () => { clearInterval(interval); setOffline(); };
  }, [userId]);

  const loadGameState = useCallback(async () => {
    if (!userId || loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    const activeMatch = await getActiveMatch();

    if (activeMatch) {
      setMatch(activeMatch);

      // Refresh stats once per completed match (server already recorded them)
      if (activeMatch.status === 'completed' && statsRefreshedRef.current !== activeMatch.id) {
        statsRefreshedRef.current = activeMatch.id;
        getPlayerStats(userId).then(setMyStats);
      }

      if (activeMatch.status === 'waiting') {
        setPhase('waiting');
      } else if (activeMatch.status === 'completed') {
        // Bug fix: load the final round data so match-end shows real results
        const currentRound = await getCurrentRound(activeMatch.id);
        if (currentRound) {
          setRound(currentRound);
          if (currentRound.id) {
            const seq = await getOpponentSequence(currentRound.id);
            setOppSequence(seq);
          }
        }
        setPhase('match-end');
      } else {
        const currentRound = await getCurrentRound(activeMatch.id);
        setRound(currentRound);

        if (
          currentRound?.status === 'setup' &&
          currentRound.roundNumber === 1 &&
          !hasShownVersusRef.current &&
          activeMatch.playerB
        ) {
          const [nameA, nameB, statsA, statsB] = await Promise.all([
            getPlayerDisplayName(activeMatch.playerA),
            getPlayerDisplayName(activeMatch.playerB),
            getPlayerStats(activeMatch.playerA),
            getPlayerStats(activeMatch.playerB),
          ]);
          setVersusData({
            playerA: { displayName: nameA, record: statsA },
            playerB: { displayName: nameB, record: statsB },
          });
          setPhase('versus');
          hasShownVersusRef.current = true;
          setLoading(false);
          loadingRef.current = false;
          return;
        }

        if (currentRound?.status === 'setup') {
          setPhase(currentRound.mySequenceLocked ? 'waiting' : 'setup');
        } else if (currentRound?.status === 'active') {
          setPhase('playing');
        } else if (currentRound?.status === 'completed') {
          // Fetch opponent sequence for reveal
          if (currentRound.id) {
            const seq = await getOpponentSequence(currentRound.id);
            setOppSequence(seq);
          }
          setPhase('round-end');
        }
      }
    } else {
      setPhase('lobby');
    }
    setLoading(false);
    loadingRef.current = false;
  }, [userId]);

  // Debounced version for realtime events
  const debouncedLoadGameState = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      loadGameState();
    }, 300);
  }, [loadGameState]);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    loadGameState();
  }, [userId]);

  // Realtime: match updates — stable subscription keyed only on match.id
  useEffect(() => {
    if (!match?.id) return;
    const channel = supabase
      .channel(`morphcode-match-${match.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'morphcode_matches', filter: `id=eq.${match.id}` }, () => debouncedLoadGameState())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'morphcode_rounds', filter: `match_id=eq.${match.id}` }, () => debouncedLoadGameState())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'morphcode_guesses' }, () => debouncedLoadGameState())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [match?.id, debouncedLoadGameState]);

  // Realtime: lobby polling
  useEffect(() => {
    if (phase !== 'lobby' && phase !== 'waiting') return;
    if (!userId) return;
    const channel = supabase
      .channel('morphcode-lobby')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'morphcode_matches' }, async (payload) => {
        const row = payload.new as any;
        if (row && (row.player_a === userId || row.player_b === userId)) {
          debouncedLoadGameState();
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [phase, userId, debouncedLoadGameState]);

  const handleMatchFound = () => { loadGameState(); };

  const handleCancelMatch = async () => {
    if (!match) return;
    await cancelMatch(match.id);
    setMatch(null);
    setRound(null);
    hasShownVersusRef.current = false;
    setPhase('lobby');
  };

  const handleVersusComplete = useCallback(() => {
    if (!round) return;
    setPhase(round.mySequenceLocked ? 'waiting' : 'setup');
  }, [round]);

  const handleLockSequence = async (sequence: Symbol[]) => {
    if (!round) return;
    const success = await lockSequence(round.id, sequence);
    if (success) { toast.success('Sequence locked!'); loadGameState(); }
    else { toast.error('Failed to lock sequence'); }
  };

  const handleSubmitGuess = async (guess: Symbol[]) => {
    if (!round) return;
    const turnStart = round.turnStartedAt ? new Date(round.turnStartedAt).getTime() : Date.now();
    const timeTaken = Date.now() - turnStart;
    const result = await submitGuess(round.id, guess, timeTaken);
    if (result) {
      if (result.isSolve) { playCodeSolved(); toast.success('Solved! 🎉'); }
      else toast(`${result.exact} exact, ${result.shifted} shifted`);
      loadGameState();
    } else {
      toast.error('Failed to submit guess');
    }
  };

  const handleNextRound = async () => {
    if (!match) return;
    if (match.status === 'completed') {
      setMatch(null);
      setRound(null);
      hasShownVersusRef.current = false;
      statsRefreshedRef.current = null;
      setOppSequence(null);
      setPhase('lobby');
      return;
    }
    setOppSequence(null);
    const success = await createNextRound(match.id);
    if (success) loadGameState();
    else toast.error('Failed to start next round');
  };

  const handleRematch = async () => {
    if (!match || !userId) return;
    const opponentId = match.playerA === userId ? match.playerB : match.playerA;
    if (!opponentId) return;
    const result = await createRematch(opponentId);
    if (result) {
      setMatch(null);
      setRound(null);
      hasShownVersusRef.current = false;
      statsRefreshedRef.current = null;
      setOppSequence(null);
      loadGameState();
    } else {
      toast.error('Failed to create rematch');
    }
  };

  const getRoundInfo = () => {
    if (!match || !round) return undefined;
    return `Round ${round.roundNumber} • ${match.roundWinsA}–${match.roundWinsB}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: 'hsl(var(--code-page-bg))' }}>
        <MorphcodeHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
               style={{ borderColor: 'hsl(var(--code-accent))', borderTopColor: 'transparent' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'hsl(var(--code-page-bg))' }}>
      <MorphcodeHeader matchActive={!!match} roundInfo={getRoundInfo()} />

      {phase === 'versus' && versusData && (
        <VersusScreen
          playerA={versusData.playerA}
          playerB={versusData.playerB}
          onComplete={handleVersusComplete}
        />
      )}

      {match && userId && (phase === 'setup' || phase === 'playing' || phase === 'waiting') && match.status !== 'waiting' && (
        <MatchScoreBar match={match} myId={userId} />
      )}

      <main className="flex-1 overflow-y-auto">
        {phase === 'lobby' && (
          <>
            {myStats && userId && (
              <div className="px-4 pt-4 max-w-sm mx-auto">
                <XPBar xp={myStats.xp} level={myStats.level} wins={myStats.wins} streak={myStats.current_streak} />
              </div>
            )}
            <MorphcodeLobby
              onMatchFound={handleMatchFound}
              isLoggedIn={!!userId}
              onLoginRequired={() => navigate('/login')}
            />
          </>
        )}

        {phase === 'waiting' && match?.status === 'waiting' && (
          <MorphcodeLobby
            onMatchFound={handleMatchFound}
            isLoggedIn={!!userId}
            onLoginRequired={() => navigate('/login')}
            existingInviteCode={match.inviteCode}
            existingMatchId={match.id}
            onMatchCancelled={handleCancelMatch}
          />
        )}

        {phase === 'setup' && round && (
          <div className="py-8">
            <SequenceBuilder
              symbolPool={round.symbolPool}
              onLock={handleLockSequence}
              locked={round.mySequenceLocked}
            />
          </div>
        )}

        {phase === 'waiting' && match?.status !== 'waiting' && round?.mySequenceLocked && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-12">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
                 style={{ borderColor: 'hsl(var(--code-accent))', borderTopColor: 'transparent' }} />
            <p className="font-inter" style={{ color: 'hsl(var(--code-text-secondary))' }}>
              Waiting for opponent to lock their sequence...
            </p>
          </div>
        )}

        {phase === 'playing' && round && userId && (
          <div className="py-4 px-4">
            <GuessBoard
              symbolPool={round.symbolPool}
              myGuesses={round.myGuesses}
              opponentGuesses={round.opponentGuesses}
              isMyTurn={round.currentTurn === userId}
              onSubmitGuess={handleSubmitGuess}
              mySolved={round.mySolved}
              opponentSolved={round.opponentSolved}
              turnTimeSeconds={match?.turnTimeSeconds || 90}
              turnStartedAt={round.turnStartedAt}
            />
          </div>
        )}

        {phase === 'round-end' && round && userId && match && (
          <RoundResults
            roundNumber={round.roundNumber}
            winnerId={round.winnerId}
            myId={userId}
            myGuessCount={round.myGuessCount}
            opponentGuessCount={round.opponentGuessCount}
            mySolved={round.mySolved}
            opponentSolved={round.opponentSolved}
            opponentSequence={oppSequence || undefined}
            mySequence={round.mySequence || undefined}
            onNextRound={handleNextRound}
            matchOver={match.status === 'completed'}
            matchWinnerId={match.winnerId}
            onRematch={match.status === 'completed' ? handleRematch : undefined}
            myWins={myStats?.wins || 0}
            myStreak={myStats?.current_streak || 0}
          />
        )}

        {phase === 'match-end' && match && userId && (
          <RoundResults
            roundNumber={round?.roundNumber || match.currentRound}
            winnerId={round?.winnerId || null}
            myId={userId}
            myGuessCount={round?.myGuessCount || 0}
            opponentGuessCount={round?.opponentGuessCount || 0}
            mySolved={round?.mySolved || false}
            opponentSolved={round?.opponentSolved || false}
            opponentSequence={oppSequence || undefined}
            onNextRound={handleNextRound}
            matchOver={true}
            matchWinnerId={match.winnerId}
            onRematch={handleRematch}
            myWins={myStats?.wins || 0}
            myStreak={myStats?.current_streak || 0}
          />
        )}
      </main>
    </div>
  );
};

export default MorphCode;