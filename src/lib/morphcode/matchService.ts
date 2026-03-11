import { supabase } from '@/integrations/supabase/client';
import { generateInviteCode, calculateFeedback, validateSequence } from './gameEngine';
import { Symbol, ALL_SYMBOLS, MatchState, RoundState, GuessEntry } from './types';

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

  // Find the match
  const { data: match, error: findErr } = await supabase
    .from('morphcode_matches')
    .select('id, player_a')
    .eq('invite_code', code.toUpperCase())
    .eq('status', 'waiting')
    .single();

  if (findErr || !match) return null;
  if (match.player_a === user.id) return null; // Can't join own match

  // Join the match
  const { error: updateErr } = await supabase
    .from('morphcode_matches')
    .update({ 
      player_b: user.id, 
      status: 'setup',
      current_round: 1,
    })
    .eq('id', match.id);

  if (updateErr) return null;

  // Create first round
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

  // Check if someone is already waiting
  const { data: waiting } = await supabase
    .from('morphcode_matchmaking')
    .select('id, user_id')
    .neq('user_id', user.id)
    .order('joined_at', { ascending: true })
    .limit(1)
    .single();

  if (waiting) {
    // Match found! Remove from queue and create match
    await supabase
      .from('morphcode_matchmaking')
      .delete()
      .eq('id', waiting.id);

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
      await supabase
        .from('morphcode_rounds')
        .insert({
          match_id: match.id,
          round_number: 1,
          first_guesser: firstGuesser,
          status: 'setup',
        });
    }
  } else {
    // No one waiting, join queue
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
  await supabase
    .from('morphcode_matchmaking')
    .delete()
    .eq('user_id', user.id);
}

/**
 * Lock in a sequence for a round
 */
export async function lockSequence(roundId: string, sequence: Symbol[]): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const validation = validateSequence(sequence, ALL_SYMBOLS);
  if (!validation.valid) return false;

  // Get round to determine if player is A or B
  const { data: round } = await supabase
    .from('morphcode_rounds')
    .select('match_id')
    .eq('id', roundId)
    .single();
  if (!round) return false;

  const { data: match } = await supabase
    .from('morphcode_matches')
    .select('player_a, player_b')
    .eq('id', round.match_id)
    .single();
  if (!match) return false;

  const isPlayerA = user.id === match.player_a;
  const updateData: Record<string, unknown> = isPlayerA
    ? { sequence_a: sequence, sequence_a_locked: true }
    : { sequence_b: sequence, sequence_b_locked: true };

  const { error } = await supabase
    .from('morphcode_rounds')
    .update(updateData)
    .eq('id', roundId);

  if (error) return false;

  // Check if both locked - if so, start the round
  const { data: updated } = await supabase
    .from('morphcode_rounds')
    .select('sequence_a_locked, sequence_b_locked, first_guesser')
    .eq('id', roundId)
    .single();

  if (updated?.sequence_a_locked && updated?.sequence_b_locked) {
    await supabase
      .from('morphcode_rounds')
      .update({ 
        status: 'active', 
        current_turn: updated.first_guesser,
        turn_started_at: new Date().toISOString(),
      })
      .eq('id', roundId);

    await supabase
      .from('morphcode_matches')
      .update({ status: 'active' })
      .eq('id', round.match_id);
  }

  return true;
}

/**
 * Submit a guess
 */
export async function submitGuess(
  roundId: string,
  guess: Symbol[],
  timeTakenMs: number
): Promise<{ exact: number; shifted: number; isSolve: boolean } | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const validation = validateSequence(guess, ALL_SYMBOLS);
  if (!validation.valid) return null;

  // Get round data
  const { data: round } = await supabase
    .from('morphcode_rounds')
    .select('*, morphcode_matches!inner(player_a, player_b)')
    .eq('id', roundId)
    .single();

  if (!round || round.status !== 'active') return null;
  if (round.current_turn !== user.id) return null;

  const match = (round as any).morphcode_matches;
  const isPlayerA = user.id === match.player_a;
  const opponentSequence = isPlayerA ? round.sequence_b : round.sequence_a;

  if (!opponentSequence) return null;

  // Calculate feedback
  const feedback = calculateFeedback(guess, opponentSequence as Symbol[]);
  const isSolve = feedback.exact === 4;
  const guessNumber = isPlayerA ? round.guesses_a + 1 : round.guesses_b + 1;

  // Insert guess
  await supabase.from('morphcode_guesses').insert({
    round_id: roundId,
    player_id: user.id,
    guess_number: guessNumber,
    guess,
    exact_count: feedback.exact,
    shifted_count: feedback.shifted,
    is_solve: isSolve,
    time_taken_ms: timeTakenMs,
  });

  // Update round state
  const roundUpdate: Record<string, unknown> = isPlayerA
    ? { 
        guesses_a: guessNumber, 
        solved_by_a: isSolve || round.solved_by_a,
        time_used_a_ms: (round.time_used_a_ms || 0) + timeTakenMs,
      }
    : { 
        guesses_b: guessNumber,
        solved_by_b: isSolve || round.solved_by_b,
        time_used_b_ms: (round.time_used_b_ms || 0) + timeTakenMs,
      };

  // Determine next turn
  const opponentId = isPlayerA ? match.player_b : match.player_a;
  const myGuesses = guessNumber;
  const opponentGuesses = isPlayerA ? round.guesses_b : round.guesses_a;
  const opponentSolved = isPlayerA ? round.solved_by_b : round.solved_by_a;

  // Check if round should end
  let roundEnded = false;
  
  if (isSolve) {
    // I solved - does opponent get equal turn?
    if (myGuesses > opponentGuesses && !opponentSolved) {
      // Opponent gets a reply turn
      roundUpdate.current_turn = opponentId;
      roundUpdate.turn_started_at = new Date().toISOString();
    } else if (opponentSolved || myGuesses === opponentGuesses) {
      // Both have equal turns or both solved
      roundEnded = true;
    } else {
      roundUpdate.current_turn = opponentId;
      roundUpdate.turn_started_at = new Date().toISOString();
    }
  } else if (myGuesses >= 8) {
    // I used all guesses
    if (opponentGuesses >= 8 || opponentSolved) {
      roundEnded = true;
    } else if (myGuesses > opponentGuesses) {
      roundUpdate.current_turn = opponentId;
      roundUpdate.turn_started_at = new Date().toISOString();
    } else {
      roundEnded = true;
    }
  } else {
    // Normal turn transition
    roundUpdate.current_turn = opponentId;
    roundUpdate.turn_started_at = new Date().toISOString();
  }

  if (roundEnded) {
    roundUpdate.status = 'completed';
    roundUpdate.completed_at = new Date().toISOString();
    roundUpdate.current_turn = null;

    // Determine winner
    const finalSolvedA = isPlayerA ? (isSolve || round.solved_by_a) : round.solved_by_a;
    const finalSolvedB = isPlayerA ? round.solved_by_b : (isSolve || round.solved_by_b);
    const finalGuessesA = isPlayerA ? myGuesses : opponentGuesses;
    const finalGuessesB = isPlayerA ? opponentGuesses : myGuesses;
    const finalTimeA = isPlayerA 
      ? (round.time_used_a_ms || 0) + timeTakenMs 
      : (round.time_used_a_ms || 0);
    const finalTimeB = isPlayerA 
      ? (round.time_used_b_ms || 0) 
      : (round.time_used_b_ms || 0) + timeTakenMs;

    let winnerId: string | null = null;
    if (finalSolvedA && finalSolvedB) {
      if (finalGuessesA < finalGuessesB) winnerId = match.player_a;
      else if (finalGuessesB < finalGuessesA) winnerId = match.player_b;
      else if (finalTimeA < finalTimeB) winnerId = match.player_a;
      else if (finalTimeB < finalTimeA) winnerId = match.player_b;
    } else if (finalSolvedA) {
      winnerId = match.player_a;
    } else if (finalSolvedB) {
      winnerId = match.player_b;
    }

    roundUpdate.winner_id = winnerId;

    // Update match round wins
    if (winnerId) {
      const isWinnerA = winnerId === match.player_a;
      const newWinsA = isWinnerA ? 1 : 0;
      const newWinsB = isWinnerA ? 0 : 1;
      
      // We need current wins from match - fetch separately
      const { data: currentMatch } = await supabase
        .from('morphcode_matches')
        .select('round_wins_a, round_wins_b, rounds_to_win')
        .eq('id', round.match_id)
        .single();

      if (currentMatch) {
        const totalWinsA = currentMatch.round_wins_a + newWinsA;
        const totalWinsB = currentMatch.round_wins_b + newWinsB;
        const matchUpdate: Record<string, unknown> = {
          round_wins_a: totalWinsA,
          round_wins_b: totalWinsB,
        };

        if (totalWinsA >= currentMatch.rounds_to_win || totalWinsB >= currentMatch.rounds_to_win) {
          matchUpdate.status = 'completed';
          matchUpdate.winner_id = totalWinsA >= currentMatch.rounds_to_win ? match.player_a : match.player_b;
          matchUpdate.completed_at = new Date().toISOString();
        }

        await supabase
          .from('morphcode_matches')
          .update(matchUpdate)
          .eq('id', round.match_id);
      }
    }
  }

  await supabase
    .from('morphcode_rounds')
    .update(roundUpdate)
    .eq('id', roundId);

  return { exact: feedback.exact, shifted: feedback.shifted, isSolve };
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

  // Get guesses
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
