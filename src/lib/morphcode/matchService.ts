import { supabase } from '@/integrations/supabase/client';
import { generateInviteCode } from './gameEngine';
import { Symbol, ALL_SYMBOLS, MatchState, RoundState, GuessEntry } from './types';

/**
 * Call the morphcode-game edge function
 */
async function callGameFunction(action: string, params: Record<string, unknown>): Promise<{ data: any; error: string | null }> {
  const { data, error } = await supabase.functions.invoke('morphcode-game', {
    body: { action, ...params },
  });
  if (error) return { data: null, error: error.message };
  if (data?.error) return { data: null, error: data.error };
  return { data, error: null };
}

/**
 * Create a new match with an invite code
 */
export async function createMatch(): Promise<{ matchId: string; inviteCode: string } | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const inviteCode = generateInviteCode();
  
  const { data, error } = await supabase
    .from('morphcode_matches')
    .insert({
      player_a: user.id,
      invite_code: inviteCode,
      status: 'waiting',
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating match:', error);
    return null;
  }

  return { matchId: data.id, inviteCode };
}

/**
 * Join a match via invite code
 */
export async function joinMatchByCode(code: string): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: match, error: findErr } = await supabase
    .from('morphcode_matches')
    .select('id, player_a')
    .eq('invite_code', code.toUpperCase())
    .eq('status', 'waiting')
    .single();

  if (findErr || !match) return null;
  if (match.player_a === user.id) return null;

  const { error: updateErr } = await supabase
    .from('morphcode_matches')
    .update({ 
      player_b: user.id, 
      status: 'setup',
      current_round: 1,
    })
    .eq('id', match.id);

  if (updateErr) return null;

  const firstGuesser = Math.random() < 0.5 ? match.player_a : user.id;
  await supabase
    .from('morphcode_rounds')
    .insert({
      match_id: match.id,
      round_number: 1,
      first_guesser: firstGuesser,
      status: 'setup',
    });

  return match.id;
}

/**
 * Join matchmaking queue
 */
export async function joinQueue(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: waiting } = await supabase
    .from('morphcode_matchmaking')
    .select('id, user_id')
    .neq('user_id', user.id)
    .order('joined_at', { ascending: true })
    .limit(1)
    .single();

  if (waiting) {
    await supabase.from('morphcode_matchmaking').delete().eq('id', waiting.id);

    const inviteCode = generateInviteCode();
    const firstGuesser = Math.random() < 0.5 ? waiting.user_id : user.id;

    const { data: match } = await supabase
      .from('morphcode_matches')
      .insert({
        player_a: waiting.user_id,
        player_b: user.id,
        status: 'setup',
        current_round: 1,
        invite_code: inviteCode,
      })
      .select('id')
      .single();

    if (match) {
      await supabase.from('morphcode_rounds').insert({
        match_id: match.id,
        round_number: 1,
        first_guesser: firstGuesser,
        status: 'setup',
      });
    }
  } else {
    await supabase
      .from('morphcode_matchmaking')
      .upsert({ user_id: user.id, timer_mode: 'live' });
  }
}

/**
 * Leave matchmaking queue
 */
export async function leaveQueue(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('morphcode_matchmaking').delete().eq('user_id', user.id);
}

/**
 * Lock in a sequence via edge function (server-validated)
 */
export async function lockSequence(roundId: string, sequence: Symbol[]): Promise<boolean> {
  const { error } = await callGameFunction('lock_sequence', {
    round_id: roundId,
    sequence,
  });
  return !error;
}

/**
 * Submit a guess via edge function (server-validated, anti-cheat)
 */
export async function submitGuess(
  roundId: string,
  guess: Symbol[],
  timeTakenMs: number
): Promise<{ exact: number; shifted: number; isSolve: boolean } | null> {
  const { data, error } = await callGameFunction('submit_guess', {
    round_id: roundId,
    guess,
    time_taken_ms: timeTakenMs,
  });

  if (error || !data) return null;

  return {
    exact: data.exact,
    shifted: data.shifted,
    isSolve: data.is_solve,
  };
}

/**
 * Create next round via edge function
 */
export async function createNextRound(matchId: string): Promise<boolean> {
  const { error } = await callGameFunction('create_next_round', { match_id: matchId });
  return !error;
}

/**
 * Get current match state
 */
export async function getActiveMatch(): Promise<MatchState | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('morphcode_matches')
    .select('*')
    .or(`player_a.eq.${user.id},player_b.eq.${user.id}`)
    .in('status', ['waiting', 'setup', 'active'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!data) return null;

  return {
    id: data.id,
    playerA: data.player_a,
    playerB: data.player_b,
    status: data.status as MatchState['status'],
    winnerId: data.winner_id,
    roundWinsA: data.round_wins_a,
    roundWinsB: data.round_wins_b,
    currentRound: data.current_round,
    inviteCode: data.invite_code,
    timerMode: data.timer_mode as 'live' | 'async',
    turnTimeSeconds: data.turn_time_seconds,
  };
}

/**
 * Get current round for a match
 */
export async function getCurrentRound(matchId: string): Promise<RoundState | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: match } = await supabase
    .from('morphcode_matches')
    .select('player_a, player_b, current_round')
    .eq('id', matchId)
    .single();
  if (!match) return null;

  const { data: round } = await supabase
    .from('morphcode_rounds')
    .select('*')
    .eq('match_id', matchId)
    .eq('round_number', match.current_round)
    .single();
  if (!round) return null;

  const isPlayerA = user.id === match.player_a;

  const { data: guesses } = await supabase
    .from('morphcode_guesses')
    .select('*')
    .eq('round_id', round.id)
    .order('guess_number', { ascending: true });

  const myGuesses: GuessEntry[] = (guesses || [])
    .filter(g => g.player_id === user.id)
    .map(g => ({
      id: g.id,
      guess: g.guess as Symbol[],
      exact: g.exact_count,
      shifted: g.shifted_count,
      isSolve: g.is_solve,
      timeTakenMs: g.time_taken_ms,
    }));

  const opponentGuesses: GuessEntry[] = (guesses || [])
    .filter(g => g.player_id !== user.id)
    .map(g => ({
      id: g.id,
      guess: g.guess as Symbol[],
      exact: g.exact_count,
      shifted: g.shifted_count,
      isSolve: g.is_solve,
      timeTakenMs: g.time_taken_ms,
    }));

  return {
    id: round.id,
    matchId: round.match_id,
    roundNumber: round.round_number,
    status: round.status as RoundState['status'],
    firstGuesser: round.first_guesser,
    currentTurn: round.current_turn,
    mySequence: isPlayerA ? (round.sequence_a as Symbol[] | null) : (round.sequence_b as Symbol[] | null),
    mySequenceLocked: isPlayerA ? round.sequence_a_locked : round.sequence_b_locked,
    opponentSequenceLocked: isPlayerA ? round.sequence_b_locked : round.sequence_a_locked,
    myGuesses,
    opponentGuesses,
    myGuessCount: isPlayerA ? round.guesses_a : round.guesses_b,
    opponentGuessCount: isPlayerA ? round.guesses_b : round.guesses_a,
    mySolved: isPlayerA ? round.solved_by_a : round.solved_by_b,
    opponentSolved: isPlayerA ? round.solved_by_b : round.solved_by_a,
    winnerId: round.winner_id,
    symbolPool: round.symbol_pool as Symbol[],
    turnStartedAt: round.turn_started_at,
  };
}
