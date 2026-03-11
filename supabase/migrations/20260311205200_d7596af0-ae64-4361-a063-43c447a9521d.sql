
-- Morphcode: Core game tables

-- Match table: tracks overall match between 2 players
CREATE TABLE public.morphcode_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_a uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player_b uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'setup', 'active', 'completed', 'forfeited', 'expired')),
  winner_id uuid REFERENCES auth.users(id),
  rounds_to_win integer NOT NULL DEFAULT 2,
  round_wins_a integer NOT NULL DEFAULT 0,
  round_wins_b integer NOT NULL DEFAULT 0,
  current_round integer NOT NULL DEFAULT 0,
  invite_code text UNIQUE,
  timer_mode text NOT NULL DEFAULT 'live' CHECK (timer_mode IN ('live', 'async')),
  turn_time_seconds integer NOT NULL DEFAULT 90,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- Round table: tracks individual rounds within a match
CREATE TABLE public.morphcode_rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.morphcode_matches(id) ON DELETE CASCADE,
  round_number integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'setup' CHECK (status IN ('setup', 'active', 'completed')),
  first_guesser uuid NOT NULL,
  current_turn uuid,
  sequence_a text[] CHECK (array_length(sequence_a, 1) = 4 OR sequence_a IS NULL),
  sequence_b text[] CHECK (array_length(sequence_b, 1) = 4 OR sequence_b IS NULL),
  sequence_a_locked boolean NOT NULL DEFAULT false,
  sequence_b_locked boolean NOT NULL DEFAULT false,
  guesses_a integer NOT NULL DEFAULT 0,
  guesses_b integer NOT NULL DEFAULT 0,
  solved_by_a boolean NOT NULL DEFAULT false,
  solved_by_b boolean NOT NULL DEFAULT false,
  winner_id uuid,
  time_used_a_ms bigint NOT NULL DEFAULT 0,
  time_used_b_ms bigint NOT NULL DEFAULT 0,
  symbol_pool text[] NOT NULL DEFAULT ARRAY['circle', 'triangle', 'wave', 'flame', 'eye', 'shard'],
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  turn_started_at timestamptz,
  UNIQUE(match_id, round_number)
);

-- Guess table: individual guesses with feedback
CREATE TABLE public.morphcode_guesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id uuid NOT NULL REFERENCES public.morphcode_rounds(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES auth.users(id),
  guess_number integer NOT NULL,
  guess text[] NOT NULL CHECK (array_length(guess, 1) = 4),
  exact_count integer NOT NULL DEFAULT 0,
  shifted_count integer NOT NULL DEFAULT 0,
  is_solve boolean NOT NULL DEFAULT false,
  time_taken_ms integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Matchmaking queue
CREATE TABLE public.morphcode_matchmaking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  timer_mode text NOT NULL DEFAULT 'live',
  joined_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.morphcode_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.morphcode_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.morphcode_guesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.morphcode_matchmaking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for matches
CREATE POLICY "Players can view own matches"
ON public.morphcode_matches FOR SELECT
TO authenticated
USING (auth.uid() = player_a OR auth.uid() = player_b);

CREATE POLICY "Authenticated users can create matches"
ON public.morphcode_matches FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = player_a);

CREATE POLICY "Players can update own matches"
ON public.morphcode_matches FOR UPDATE
TO authenticated
USING (auth.uid() = player_a OR auth.uid() = player_b);

-- Anyone can view a match by invite code (for joining)
CREATE POLICY "Anyone can view waiting matches by invite"
ON public.morphcode_matches FOR SELECT
TO authenticated
USING (status = 'waiting' AND invite_code IS NOT NULL);

-- RLS for rounds - players in match can view
CREATE POLICY "Players can view rounds of own matches"
ON public.morphcode_rounds FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.morphcode_matches m
    WHERE m.id = match_id
    AND (m.player_a = auth.uid() OR m.player_b = auth.uid())
  )
);

CREATE POLICY "Players can insert rounds"
ON public.morphcode_rounds FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.morphcode_matches m
    WHERE m.id = match_id
    AND (m.player_a = auth.uid() OR m.player_b = auth.uid())
  )
);

CREATE POLICY "Players can update rounds"
ON public.morphcode_rounds FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.morphcode_matches m
    WHERE m.id = match_id
    AND (m.player_a = auth.uid() OR m.player_b = auth.uid())
  )
);

-- RLS for guesses
CREATE POLICY "Players can view guesses in own matches"
ON public.morphcode_guesses FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.morphcode_rounds r
    JOIN public.morphcode_matches m ON m.id = r.match_id
    WHERE r.id = round_id
    AND (m.player_a = auth.uid() OR m.player_b = auth.uid())
  )
);

CREATE POLICY "Players can insert own guesses"
ON public.morphcode_guesses FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = player_id);

-- RLS for matchmaking
CREATE POLICY "Users can manage own queue entry"
ON public.morphcode_matchmaking FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view queue"
ON public.morphcode_matchmaking FOR SELECT
TO authenticated
USING (true);

-- Enable realtime for matches and rounds
ALTER PUBLICATION supabase_realtime ADD TABLE public.morphcode_matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.morphcode_rounds;
ALTER PUBLICATION supabase_realtime ADD TABLE public.morphcode_guesses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.morphcode_matchmaking;
