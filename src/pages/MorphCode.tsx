import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MorphcodeHeader } from '@/components/morphcode/MorphcodeHeader';
import { MorphcodeLobby } from '@/components/morphcode/MorphcodeLobby';
import { SequenceBuilder } from '@/components/morphcode/SequenceBuilder';
import { GuessBoard } from '@/components/morphcode/GuessBoard';
import { MatchScoreBar } from '@/components/morphcode/MatchScoreBar';
import { RoundResults } from '@/components/morphcode/RoundResults';
import { getActiveMatch, getCurrentRound, lockSequence, submitGuess, createNextRound } from '@/lib/morphcode/matchService';
import { MatchState, RoundState, GamePhase, Symbol } from '@/lib/morphcode/types';
import { toast } from 'sonner';

const MorphCode = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [phase, setPhase] = useState<GamePhase>('lobby');
  const [match, setMatch] = useState<MatchState | null>(null);
  const [round, setRound] = useState<RoundState | null>(null);
  const [loading, setLoading] = useState(true);

  // Auth check
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user?.id || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load active match on mount
  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    loadGameState();
  }, [userId]);

  const loadGameState = async () => {
    setLoading(true);
    const activeMatch = await getActiveMatch();
    
    if (activeMatch) {
      setMatch(activeMatch);
      
      if (activeMatch.status === 'waiting') {
        setPhase('waiting');
      } else if (activeMatch.status === 'completed') {
        setPhase('match-end');
      } else {
        const currentRound = await getCurrentRound(activeMatch.id);
        setRound(currentRound);
        
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
  };

  // Realtime subscriptions for match updates
  useEffect(() => {
    if (!match?.id) return;

    const channel = supabase
      .channel(`morphcode-match-${match.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'morphcode_matches',
        filter: `id=eq.${match.id}`,
      }, () => { loadGameState(); })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'morphcode_rounds',
        filter: `match_id=eq.${match.id}`,
      }, () => { loadGameState(); })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'morphcode_guesses',
      }, () => { loadGameState(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [match?.id]);

  // Realtime for matchmaking
  useEffect(() => {
    if (phase !== 'lobby' && phase !== 'waiting') return;
    if (!userId) return;

    const channel = supabase
      .channel('morphcode-lobby')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'morphcode_matches',
      }, async (payload) => {
        const row = payload.new as any;
        if (row && (row.player_a === userId || row.player_b === userId)) {
          loadGameState();
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [phase, userId]);

  const handleMatchFound = () => { loadGameState(); };

  const handleLockSequence = async (sequence: Symbol[]) => {
    if (!round) return;
    const success = await lockSequence(round.id, sequence);
    if (success) {
      toast.success('Sequence locked!');
      loadGameState();
    } else {
      toast.error('Failed to lock sequence');
    }
  };

  const handleSubmitGuess = async (guess: Symbol[]) => {
    if (!round) return;
    const turnStart = round.turnStartedAt ? new Date(round.turnStartedAt).getTime() : Date.now();
    const timeTaken = Date.now() - turnStart;
    
    const result = await submitGuess(round.id, guess, timeTaken);
    if (result) {
      if (result.isSolve) {
        toast.success('Solved! 🎉');
      } else {
        toast(`${result.exact} exact, ${result.shifted} shifted`);
      }
      loadGameState();
    } else {
      toast.error('Failed to submit guess');
    }
  };

  const handleNextRound = async () => {
    if (!match) return;
    
    if (match.status === 'completed') {
      // Match over — return to lobby
      setMatch(null);
      setRound(null);
      setPhase('lobby');
      return;
    }

    // Create next round via edge function
    const success = await createNextRound(match.id);
    if (success) {
      loadGameState();
    } else {
      toast.error('Failed to start next round');
    }
  };

  const getRoundInfo = () => {
    if (!match || !round) return undefined;
    return `Round ${round.roundNumber} • ${match.roundWinsA}–${match.roundWinsB}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: 'hsl(var(--background))' }}>
        <MorphcodeHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" 
               style={{ borderColor: 'hsl(var(--primary))', borderTopColor: 'transparent' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'hsl(var(--background))' }}>
      <MorphcodeHeader matchActive={!!match} roundInfo={getRoundInfo()} />
      
      {/* Score bar during active match */}
      {match && userId && (phase === 'setup' || phase === 'playing' || phase === 'waiting') && match.status !== 'waiting' && (
        <MatchScoreBar match={match} myId={userId} />
      )}

      <main className="flex-1 overflow-y-auto">
        {(phase === 'lobby') && (
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
                 style={{ borderColor: 'hsl(var(--primary))', borderTopColor: 'transparent' }} />
            <p style={{ color: 'hsl(var(--muted-foreground))' }}>
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
