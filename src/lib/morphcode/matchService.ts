import { supabase } from '@/integrations/supabase/client';
import { generateInviteCode } from './gameEngine';
import { Symbol, MatchState, RoundState, GuessEntry } from './types';

// --- Edge function caller ---

async function callGameFunction(action: string, params: Record<string, unknown>): Promise<{ data: any; error: string | null }> {
  const { data, error } = await supabase.functions.invoke('morphcode-game', {
    body: { action, ...params },
  });
  if (error) return { data: null, error: error.message };
  if (data?.error) return { data: null, error: data.error };
  return { data, error: null };
}

// --- Match CRUD ---

export async function createMatch(): Promise<{ matchId: string; inviteCode: string } | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Expire any stale waiting matches created by this user
  await supabase
    .from('morphcode_matches')
    .update({ status: 'expired' })
    .eq('player_a', user.id)
    .eq('status', 'waiting');

  const inviteCode = generateInviteCode();

  const { data, error } = await supabase
    .from('morphcode_matches')
    .insert({ player_a: user.id, invite_code: inviteCode, status: 'waiting' })
    .select('id')
    .single();

  if (error) { console.error('Error creating match:', error); return null; }
  return { matchId: data.id, inviteCode };
}

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

  return await finalizeJoin(match.id, match.player_a, user.id);
}

export async function joinMatchById(matchId: string): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: match, error: findErr } = await supabase
    .from('morphcode_matches')
    .select('id, player_a')
    .eq('id', matchId)
    .eq('status', 'waiting')
    .single();

  if (findErr || !match) return null;
  if (match.player_a === user.id) return null;

  return await finalizeJoin(match.id, match.player_a, user.id);
}

async function finalizeJoin(matchId: string, playerA: string, playerB: string): Promise<string | null> {
  const { error: updateErr } = await supabase
    .from('morphcode_matches')
    .update({ player_b: playerB, status: 'setup', current_round: 1 })
    .eq('id', matchId);

  if (updateErr) return null;

  const firstGuesser = Math.random() < 0.5 ? playerA : playerB;
  await supabase.from('morphcode_rounds').insert({
    match_id: matchId, round_number: 1, first_guesser: firstGuesser, status: 'setup',
  });

  return matchId;
}

export async function cancelMatch(matchId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: match } = await supabase
    .from('morphcode_matches')
    .select('status, player_a')
    .eq('id', matchId)
    .single();

  if (!match) return false;

  if (match.status === 'waiting') {
    const { error } = await supabase
      .from('morphcode_matches')
      .update({ status: 'expired' })
      .eq('id', matchId);
    return !error;
  }

  const { error } = await supabase
    .from('morphcode_matches')
    .update({ status: 'forfeited', completed_at: new Date().toISOString() })
    .eq('id', matchId);
  return !error;
}

// --- Challenge a friend directly ---

export async function challengeFriend(friendUserId: string): Promise<{ matchId: string } | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const result = await createMatch();
  if (!result) return null;

  // Post a challenge activity visible to the friend
  await supabase.from('app_activity').insert({
    user_id: user.id,
    game: 'morphcode',
    activity_type: 'challenge',
    payload: { match_id: result.matchId, target_user_id: friendUserId },
  });

  return { matchId: result.matchId };
}

export interface IncomingChallenge {
  activityId: string;
  matchId: string;
  challengerName: string;
  challengerUserId: string;
  createdAt: string;
}

export async function getIncomingChallenges(): Promise<IncomingChallenge[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Get challenge activities from friends
  const { data: activities } = await supabase
    .from('app_activity')
    .select('id, user_id, payload, created_at')
    .eq('game', 'morphcode')
    .eq('activity_type', 'challenge')
    .order('created_at', { ascending: false })
    .limit(20);

  if (!activities || activities.length === 0) return [];

  // Filter to challenges targeted at me
  const myActivities = activities.filter(a => {
    const p = a.payload as Record<string, any>;
    return p?.target_user_id === user.id;
  });

  if (myActivities.length === 0) return [];

  // Check which matches are still waiting
  const matchIds = myActivities.map(a => (a.payload as Record<string, any>).match_id).filter(Boolean);
  if (matchIds.length === 0) return [];

  const { data: matches } = await supabase
    .from('morphcode_matches')
    .select('id, status')
    .in('id', matchIds)
    .eq('status', 'waiting');

  const waitingIds = new Set((matches || []).map(m => m.id));

  // Get challenger display names
  const challengerIds = [...new Set(myActivities.map(a => a.user_id))];
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('user_id, display_name, default_initials')
    .in('user_id', challengerIds);

  const nameMap = new Map((profiles || []).map(p => [p.user_id, p.display_name || p.default_initials || 'Player']));

  return myActivities
    .filter(a => waitingIds.has((a.payload as Record<string, any>).match_id))
    .map(a => ({
      activityId: a.id,
      matchId: (a.payload as Record<string, any>).match_id,
      challengerName: nameMap.get(a.user_id) || 'Player',
      challengerUserId: a.user_id,
      createdAt: a.created_at,
    }));
}

export async function declineChallenge(matchId: string): Promise<boolean> {
  // Just expire the match — the activity will stop showing since match is no longer 'waiting'
  const { error } = await supabase
    .from('morphcode_matches')
    .update({ status: 'expired' })
    .eq('id', matchId);
  return !error;
}

// --- Queue ---

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
        player_a: waiting.user_id, player_b: user.id,
        status: 'setup', current_round: 1, invite_code: inviteCode,
      })
      .select('id')
      .single();

    if (match) {
      await supabase.from('morphcode_rounds').insert({
        match_id: match.id, round_number: 1, first_guesser: firstGuesser, status: 'setup',
      });
    }
  } else {
    await supabase.from('morphcode_matchmaking').upsert({ user_id: user.id, timer_mode: 'live' });
  }
}

export async function leaveQueue(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('morphcode_matchmaking').delete().eq('user_id', user.id);
}

// --- Game Actions ---

export async function lockSequence(roundId: string, sequence: Symbol[]): Promise<boolean> {
  const { error } = await callGameFunction('lock_sequence', { round_id: roundId, sequence });
  return !error;
}

export async function submitGuess(roundId: string, guess: Symbol[], timeTakenMs: number): Promise<{ exact: number; shifted: number; isSolve: boolean } | null> {
  const { data, error } = await callGameFunction('submit_guess', { round_id: roundId, guess, time_taken_ms: timeTakenMs });
  if (error || !data) return null;
  return { exact: data.exact, shifted: data.shifted, isSolve: data.is_solve };
}

export async function createNextRound(matchId: string): Promise<boolean> {
  const { error } = await callGameFunction('create_next_round', { match_id: matchId });
  return !error;
}

// --- Stats ---

export interface MorphcodePlayerStats {
  wins: number;
  losses: number;
  draws: number;
}

export async function getPlayerStats(userId: string): Promise<MorphcodePlayerStats> {
  const { data } = await supabase
    .from('morphcode_stats')
    .select('wins, losses, draws')
    .eq('user_id', userId)
    .single();
  return data || { wins: 0, losses: 0, draws: 0 };
}

export async function recordMatchResult(userId: string, result: 'win' | 'loss' | 'draw'): Promise<void> {
  const current = await getPlayerStats(userId);
  const updated = {
    wins: current.wins + (result === 'win' ? 1 : 0),
    losses: current.losses + (result === 'loss' ? 1 : 0),
    draws: current.draws + (result === 'draw' ? 1 : 0),
    updated_at: new Date().toISOString(),
  };
  await supabase.from('morphcode_stats').upsert({ user_id: userId, ...updated });
}

// --- Player display name ---

export async function getPlayerDisplayName(userId: string): Promise<string> {
  const { data } = await supabase
    .from('user_profiles')
    .select('display_name, default_initials')
    .eq('user_id', userId)
    .single();
  return data?.display_name || data?.default_initials || 'Player';
}

// --- State Getters ---

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

  const mapGuess = (g: any): GuessEntry => ({
    id: g.id, guess: g.guess as Symbol[], exact: g.exact_count,
    shifted: g.shifted_count, isSolve: g.is_solve, timeTakenMs: g.time_taken_ms,
  });

  const myGuesses = (guesses || []).filter(g => g.player_id === user.id).map(mapGuess);
  const opponentGuesses = (guesses || []).filter(g => g.player_id !== user.id).map(mapGuess);

  return {
    id: round.id, matchId: round.match_id, roundNumber: round.round_number,
    status: round.status as RoundState['status'], firstGuesser: round.first_guesser,
    currentTurn: round.current_turn,
    mySequence: isPlayerA ? (round.sequence_a as Symbol[] | null) : (round.sequence_b as Symbol[] | null),
    mySequenceLocked: isPlayerA ? round.sequence_a_locked : round.sequence_b_locked,
    opponentSequenceLocked: isPlayerA ? round.sequence_b_locked : round.sequence_a_locked,
    myGuesses, opponentGuesses,
    myGuessCount: isPlayerA ? round.guesses_a : round.guesses_b,
    opponentGuessCount: isPlayerA ? round.guesses_b : round.guesses_a,
    mySolved: isPlayerA ? round.solved_by_a : round.solved_by_b,
    opponentSolved: isPlayerA ? round.solved_by_b : round.solved_by_a,
    winnerId: round.winner_id, symbolPool: round.symbol_pool as Symbol[],
    turnStartedAt: round.turn_started_at,
  };
}
