
-- Morph Clash: Head-to-head territory control word game (async)

CREATE TABLE public.clash_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_a uuid NOT NULL,
  player_b uuid,
  status text NOT NULL DEFAULT 'waiting',
  winner_id uuid,
  grid_seed text NOT NULL,
  grid_state jsonb NOT NULL DEFAULT '[]',
  ownership jsonb NOT NULL DEFAULT '{}',
  current_turn uuid,
  tiles_a integer NOT NULL DEFAULT 0,
  tiles_b integer NOT NULL DEFAULT 0,
  moves_a integer NOT NULL DEFAULT 0,
  moves_b integer NOT NULL DEFAULT 0,
  total_word_length_a integer NOT NULL DEFAULT 0,
  total_word_length_b integer NOT NULL DEFAULT 0,
  turn_deadline timestamptz,
  invite_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE public.clash_moves (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.clash_matches(id) ON DELETE CASCADE,
  player_id uuid NOT NULL,
  move_number integer NOT NULL,
  word text NOT NULL,
  tiles_used jsonb NOT NULL DEFAULT '[]',
  tiles_claimed jsonb NOT NULL DEFAULT '[]',
  bonus_claims jsonb NOT NULL DEFAULT '[]',
  grid_snapshot jsonb NOT NULL DEFAULT '[]',
  ownership_snapshot jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clash_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clash_moves ENABLE ROW LEVEL SECURITY;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.clash_matches;

-- RLS policies for clash_matches
CREATE POLICY "Anyone can view waiting matches by invite"
  ON public.clash_matches FOR SELECT TO authenticated
  USING (status = 'waiting' AND invite_code IS NOT NULL);

CREATE POLICY "Players can view own matches"
  ON public.clash_matches FOR SELECT TO authenticated
  USING (auth.uid() = player_a OR auth.uid() = player_b);

CREATE POLICY "Authenticated users can create matches"
  ON public.clash_matches FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = player_a);

CREATE POLICY "Players can update own matches"
  ON public.clash_matches FOR UPDATE TO authenticated
  USING (auth.uid() = player_a OR auth.uid() = player_b);

-- RLS policies for clash_moves
CREATE POLICY "Players can view moves of own matches"
  ON public.clash_moves FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.clash_matches m
    WHERE m.id = clash_moves.match_id
    AND (m.player_a = auth.uid() OR m.player_b = auth.uid())
  ));

CREATE POLICY "Players can insert moves"
  ON public.clash_moves FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = player_id);

-- Join match RPC (security definer to bypass RLS)
CREATE OR REPLACE FUNCTION public.join_clash_match(p_match_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_player_a uuid;
  v_first_turn uuid;
  v_grid_seed text;
BEGIN
  SELECT player_a, grid_seed INTO v_player_a, v_grid_seed
  FROM clash_matches
  WHERE id = p_match_id AND status = 'waiting';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match not found or not waiting';
  END IF;

  IF v_player_a = auth.uid() THEN
    RAISE EXCEPTION 'Cannot join your own match';
  END IF;

  -- Randomly pick first turn
  IF random() < 0.5 THEN
    v_first_turn := v_player_a;
  ELSE
    v_first_turn := auth.uid();
  END IF;

  UPDATE clash_matches
  SET player_b = auth.uid(),
      status = 'active',
      current_turn = v_first_turn,
      turn_deadline = now() + interval '24 hours',
      updated_at = now()
  WHERE id = p_match_id AND status = 'waiting';

  RETURN p_match_id;
END;
$$;
