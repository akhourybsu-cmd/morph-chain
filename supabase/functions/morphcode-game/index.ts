import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SLOTS = 4;
const MAX_GUESSES = 8;
const MAX_ROUNDS = 5;
const VALID_SYMBOLS = ['circle', 'triangle', 'wave', 'flame', 'eye', 'shard'];

function calculateFeedback(guess: string[], sequence: string[]): { exact: number; shifted: number } {
  let exact = 0;
  const unmatchedGuess: (string | null)[] = [...guess];
  const unmatchedSeq: (string | null)[] = [...sequence];

  for (let i = 0; i < SLOTS; i++) {
    if (guess[i] === sequence[i]) {
      exact++;
      unmatchedGuess[i] = null;
      unmatchedSeq[i] = null;
    }
  }

  let shifted = 0;
  for (let i = 0; i < SLOTS; i++) {
    if (unmatchedGuess[i] === null) continue;
    const idx = unmatchedSeq.indexOf(unmatchedGuess[i]);
    if (idx !== -1) {
      shifted++;
      unmatchedSeq[idx] = null;
    }
  }

  return { exact, shifted };
}

function validateGuessSymbols(guess: string[]): string | null {
  if (!Array.isArray(guess) || guess.length !== SLOTS) return 'Guess must have exactly 4 symbols';
  const seen = new Set<string>();
  for (const s of guess) {
    if (!VALID_SYMBOLS.includes(s)) return `Invalid symbol: ${s}`;
    if (seen.has(s)) return `Duplicate symbol: ${s}`;
    seen.add(s);
  }
  return null;
}

async function recordStats(adminClient: any, userId: string, result: 'win' | 'loss' | 'draw') {
  const { data: current } = await adminClient
    .from('morphcode_stats')
    .select('wins, losses, draws')
    .eq('user_id', userId)
    .single();

  const stats = current || { wins: 0, losses: 0, draws: 0 };
  await adminClient.from('morphcode_stats').upsert({
    user_id: userId,
    wins: stats.wins + (result === 'win' ? 1 : 0),
    losses: stats.losses + (result === 'loss' ? 1 : 0),
    draws: stats.draws + (result === 'draw' ? 1 : 0),
    updated_at: new Date().toISOString(),
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY')!;

    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { action, ...params } = await req.json();

    if (action === 'submit_guess') {
      const { round_id, guess, time_taken_ms } = params;

      const guessError = validateGuessSymbols(guess);
      if (guessError) {
        return new Response(JSON.stringify({ error: guessError }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Rate limiting
      const { data: recentGuesses } = await adminClient
        .from('morphcode_guesses')
        .select('created_at')
        .eq('player_id', user.id)
        .gte('created_at', new Date(Date.now() - 5000).toISOString())
        .order('created_at', { ascending: false });

      if (recentGuesses && recentGuesses.length >= 2) {
        return new Response(JSON.stringify({ error: 'Too many guesses too fast' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const { data: round, error: roundErr } = await adminClient
        .from('morphcode_rounds')
        .select('*, morphcode_matches!inner(player_a, player_b, status, turn_time_seconds, round_wins_a, round_wins_b, rounds_to_win)')
        .eq('id', round_id)
        .single();

      if (roundErr || !round) {
        return new Response(JSON.stringify({ error: 'Round not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const match = (round as any).morphcode_matches;

      if (user.id !== match.player_a && user.id !== match.player_b) {
        return new Response(JSON.stringify({ error: 'Not in this match' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      if (round.current_turn !== user.id) {
        return new Response(JSON.stringify({ error: 'Not your turn' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      if (round.status !== 'active') {
        return new Response(JSON.stringify({ error: 'Round not active' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Turn timeout enforcement
      if (round.turn_started_at) {
        const turnStart = new Date(round.turn_started_at).getTime();
        const turnLimit = (match.turn_time_seconds || 90) + 5;
        if (Date.now() - turnStart > turnLimit * 1000) {
          return new Response(JSON.stringify({ error: 'Turn time expired' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
      }

      const isPlayerA = user.id === match.player_a;
      const opponentSequence = isPlayerA ? round.sequence_b : round.sequence_a;
      const myGuessCount = isPlayerA ? round.guesses_a : round.guesses_b;

      if (!opponentSequence) {
        return new Response(JSON.stringify({ error: 'Opponent sequence not set' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      if (myGuessCount >= MAX_GUESSES) {
        return new Response(JSON.stringify({ error: 'Max guesses reached' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const feedback = calculateFeedback(guess, opponentSequence);
      const isSolve = feedback.exact === SLOTS;
      const guessNumber = myGuessCount + 1;
      const clampedTime = Math.max(0, Math.min(time_taken_ms || 0, 120000));

      await adminClient.from('morphcode_guesses').insert({
        round_id,
        player_id: user.id,
        guess_number: guessNumber,
        guess,
        exact_count: feedback.exact,
        shifted_count: feedback.shifted,
        is_solve: isSolve,
        time_taken_ms: clampedTime,
      });

      const roundUpdate: Record<string, unknown> = isPlayerA
        ? {
            guesses_a: guessNumber,
            solved_by_a: isSolve || round.solved_by_a,
            time_used_a_ms: (round.time_used_a_ms || 0) + clampedTime,
          }
        : {
            guesses_b: guessNumber,
            solved_by_b: isSolve || round.solved_by_b,
            time_used_b_ms: (round.time_used_b_ms || 0) + clampedTime,
          };

      const opponentId = isPlayerA ? match.player_b : match.player_a;
      const opponentGuesses = isPlayerA ? round.guesses_b : round.guesses_a;
      const opponentSolved = isPlayerA ? round.solved_by_b : round.solved_by_a;

      let roundEnded = false;

      if (isSolve) {
        if (guessNumber > opponentGuesses && !opponentSolved) {
          roundUpdate.current_turn = opponentId;
          roundUpdate.turn_started_at = new Date().toISOString();
        } else {
          roundEnded = true;
        }
      } else if (guessNumber >= MAX_GUESSES) {
        if (opponentGuesses >= MAX_GUESSES || opponentSolved) {
          roundEnded = true;
        } else if (guessNumber > opponentGuesses) {
          roundUpdate.current_turn = opponentId;
          roundUpdate.turn_started_at = new Date().toISOString();
        } else {
          roundEnded = true;
        }
      } else {
        roundUpdate.current_turn = opponentId;
        roundUpdate.turn_started_at = new Date().toISOString();
      }

      if (roundEnded) {
        roundUpdate.status = 'completed';
        roundUpdate.completed_at = new Date().toISOString();
        roundUpdate.current_turn = null;

        const finalSolvedA = isPlayerA ? (isSolve || round.solved_by_a) : round.solved_by_a;
        const finalSolvedB = isPlayerA ? round.solved_by_b : (isSolve || round.solved_by_b);
        const finalGuessesA = isPlayerA ? guessNumber : opponentGuesses;
        const finalGuessesB = isPlayerA ? opponentGuesses : guessNumber;
        const finalTimeA = isPlayerA ? (round.time_used_a_ms || 0) + clampedTime : (round.time_used_a_ms || 0);
        const finalTimeB = isPlayerA ? (round.time_used_b_ms || 0) : (round.time_used_b_ms || 0) + clampedTime;

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

        // Update match scores
        const newWinsA = match.round_wins_a + (winnerId === match.player_a ? 1 : 0);
        const newWinsB = match.round_wins_b + (winnerId === match.player_b ? 1 : 0);
        const matchUpdate: Record<string, unknown> = {
          round_wins_a: newWinsA,
          round_wins_b: newWinsB,
        };

        const matchCompleted = newWinsA >= match.rounds_to_win || newWinsB >= match.rounds_to_win;

        // Max round cap: if we've hit MAX_ROUNDS without a winner, force completion
        if (!matchCompleted && round.round_number >= MAX_ROUNDS) {
          let matchWinner: string | null = null;
          if (newWinsA > newWinsB) matchWinner = match.player_a;
          else if (newWinsB > newWinsA) matchWinner = match.player_b;
          // else draw (null winner)

          matchUpdate.status = 'completed';
          matchUpdate.winner_id = matchWinner;
          matchUpdate.completed_at = new Date().toISOString();

          // Record stats server-side
          if (matchWinner) {
            await recordStats(adminClient, matchWinner, 'win');
            const loserId = matchWinner === match.player_a ? match.player_b : match.player_a;
            await recordStats(adminClient, loserId, 'loss');
          } else {
            await recordStats(adminClient, match.player_a, 'draw');
            await recordStats(adminClient, match.player_b, 'draw');
          }
        } else if (matchCompleted) {
          const matchWinner = newWinsA >= match.rounds_to_win ? match.player_a : match.player_b;
          matchUpdate.status = 'completed';
          matchUpdate.winner_id = matchWinner;
          matchUpdate.completed_at = new Date().toISOString();

          // Record stats server-side
          await recordStats(adminClient, matchWinner, 'win');
          const loserId = matchWinner === match.player_a ? match.player_b : match.player_a;
          await recordStats(adminClient, loserId, 'loss');
        }

        await adminClient.from('morphcode_matches').update(matchUpdate).eq('id', round.match_id);
      }

      await adminClient.from('morphcode_rounds').update(roundUpdate).eq('id', round_id);

      return new Response(JSON.stringify({
        exact: feedback.exact,
        shifted: feedback.shifted,
        is_solve: isSolve,
        round_ended: roundEnded,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } else if (action === 'lock_sequence') {
      const { round_id, sequence } = params;

      const seqError = validateGuessSymbols(sequence);
      if (seqError) {
        return new Response(JSON.stringify({ error: seqError }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const { data: round } = await adminClient
        .from('morphcode_rounds')
        .select('*, morphcode_matches!inner(player_a, player_b)')
        .eq('id', round_id)
        .single();

      if (!round) {
        return new Response(JSON.stringify({ error: 'Round not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const matchData = (round as any).morphcode_matches;
      const isPlayerA = user.id === matchData.player_a;

      if (user.id !== matchData.player_a && user.id !== matchData.player_b) {
        return new Response(JSON.stringify({ error: 'Not in this match' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const alreadyLocked = isPlayerA ? round.sequence_a_locked : round.sequence_b_locked;
      if (alreadyLocked) {
        return new Response(JSON.stringify({ error: 'Already locked' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const updateData: Record<string, unknown> = isPlayerA
        ? { sequence_a: sequence, sequence_a_locked: true }
        : { sequence_b: sequence, sequence_b_locked: true };

      await adminClient.from('morphcode_rounds').update(updateData).eq('id', round_id);

      const { data: updated } = await adminClient
        .from('morphcode_rounds')
        .select('sequence_a_locked, sequence_b_locked, first_guesser')
        .eq('id', round_id)
        .single();

      if (updated?.sequence_a_locked && updated?.sequence_b_locked) {
        await adminClient.from('morphcode_rounds').update({
          status: 'active',
          current_turn: updated.first_guesser,
          turn_started_at: new Date().toISOString(),
        }).eq('id', round_id);

        await adminClient.from('morphcode_matches').update({ status: 'active' }).eq('id', round.match_id);
      }

      return new Response(JSON.stringify({ success: true, both_locked: updated?.sequence_a_locked && updated?.sequence_b_locked }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'create_next_round') {
      const { match_id } = params;

      const { data: matchData } = await adminClient
        .from('morphcode_matches')
        .select('*')
        .eq('id', match_id)
        .single();

      if (!matchData || matchData.status === 'completed') {
        return new Response(JSON.stringify({ error: 'Match not available' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      // Enforce max round cap
      const { data: lastRound } = await adminClient
        .from('morphcode_rounds')
        .select('first_guesser, round_number')
        .eq('match_id', match_id)
        .order('round_number', { ascending: false })
        .limit(1)
        .single();

      const nextRoundNumber = (lastRound?.round_number || 0) + 1;

      if (nextRoundNumber > MAX_ROUNDS) {
        return new Response(JSON.stringify({ error: 'Max rounds reached' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const nextFirstGuesser = lastRound?.first_guesser === matchData.player_a
        ? matchData.player_b
        : matchData.player_a;

      await adminClient.from('morphcode_rounds').insert({
        match_id,
        round_number: nextRoundNumber,
        first_guesser: nextFirstGuesser,
        status: 'setup',
      });

      await adminClient.from('morphcode_matches').update({
        current_round: nextRoundNumber,
        status: 'setup',
      }).eq('id', match_id);

      return new Response(JSON.stringify({ success: true, round_number: nextRoundNumber }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('Morphcode error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
