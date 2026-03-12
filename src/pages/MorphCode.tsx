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
import {
  getActiveMatch, getCurrentRound, lockSequence, submitGuess,
  createNextRound, cancelMatch, getPlayerStats, getPlayerDisplayName, recordMatchResult,
} from '@/lib/morphcode/matchService';
import { updatePresence, setOffline } from '@/lib/social/friendsService';
import { MatchState, RoundState, Symbol } from '@/lib/morphcode/types';
import { toast } from 'sonner';

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
  const [hasShownVersus, setHasShownVersus] = useState(false);
  const statsRecordedRef = useRef<string | null>(null); // track which match ID we've recorded stats for

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUserId(user?.id || null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id || null);
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
    if (!userId) return;
    setLoading(true);
    const activeMatch = await getActiveMatch();

    if (activeMatch) {
      setMatch(activeMatch);

      // Record stats immediately when we detect completion (not on button click)
      if (activeMatch.status === 'completed' && statsRecordedRef.current !== activeMatch.id) {
        statsRecordedRef.current = activeMatch.id;
        if (activeMatch.winnerId === userId) recordMatchResult(userId, 'win');
        else if (activeMatch.winnerId === null) recordMatchResult(userId, 'draw');
        else recordMatchResult(userId, 'loss');
      }

      if (activeMatch.status === 'waiting') {
        setPhase('waiting');
      } else if (activeMatch.status === 'completed') {
        setPhase('match-end');
      } else {
        const currentRound = await getCurrentRound(activeMatch.id);
        setRound(currentRound);

        // Show VS screen on first setup of round 1
        if (
          currentRound?.status === 'setup' &&
          currentRound.roundNumber === 1 &&
          !hasShownVersus &&
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
          setHasShownVersus(true);
          setLoading(false);
          return;
        }

        if (currentRound?.status === 'setup') {
          setPhase(currentRound.mySequenceLocked ? 'waiting' : 'setup');
        } else if (currentRound?.status === 'active') {
          setPhase('playing');
        } else if (currentRound?.status === 'completed') {
          setPhase('round-end');
        }
      }
    } else {
      setPhase('lobby');
    }
    setLoading(false);
  }, [userId, hasShownVersus]);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    loadGameState();
  }, [userId]);

  // Realtime: match updates
  useEffect(() => {
    if (!match?.id) return;
    const channel = supabase
      .channel(`morphcode-match-${match.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'morphcode_matches', filter: `id=eq.${match.id}` }, () => loadGameState())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'morphcode_rounds', filter: `match_id=eq.${match.id}` }, () => loadGameState())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'morphcode_guesses' }, () => loadGameState())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [match?.id, loadGameState]);

  // Realtime: lobby polling
  useEffect(() => {
    if (phase !== 'lobby' && phase !== 'waiting') return;
    if (!userId) return;
    const channel = supabase
      .channel('morphcode-lobby')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'morphcode_matches' }, async (payload) => {
        const row = payload.new as any;
        if (row && (row.player_a === userId || row.player_b === userId)) {
          loadGameState();
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [phase, userId, loadGameState]);

  const handleMatchFound = () => { loadGameState(); };

  const handleCancelMatch = async () => {
    if (!match) return;
    await cancelMatch(match.id);
    setMatch(null);
    setRound(null);
    setHasShownVersus(false);
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
      if (result.isSolve) toast.success('Solved! 🎉');
      else toast(`${result.exact} exact, ${result.shifted} shifted`);
      loadGameState();
    } else {
      toast.error('Failed to submit guess');
    }
  };

  const handleNextRound = async () => {
    if (!match) return;
    if (match.status === 'completed') {
      // Stats already recorded in loadGameState, just go back to lobby
      setMatch(null);
      setRound(null);
      setHasShownVersus(false);
      statsRecordedRef.current = null;
      setPhase('lobby');
      return;
    }
    const success = await createNextRound(match.id);
    if (success) loadGameState();
    else toast.error('Failed to start next round');
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

      {/* VS Screen overlay */}
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
          <MorphcodeLobby
            onMatchFound={handleMatchFound}
            isLoggedIn={!!userId}
            onLoginRequired={() => navigate('/login')}
          />
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
            onNextRound={handleNextRound}
            matchOver={match.status === 'completed'}
            matchWinnerId={match.winnerId}
          />
        )}

        {phase === 'match-end' && match && userId && (
          <RoundResults
            roundNumber={match.currentRound}
            winnerId={match.winnerId}
            myId={userId}
            myGuessCount={0}
            opponentGuessCount={0}
            mySolved={false}
            opponentSolved={false}
            onNextRound={handleNextRound}
            matchOver={true}
            matchWinnerId={match.winnerId}
          />
        )}
      </main>
    </div>
  );
};

export default MorphCode;
