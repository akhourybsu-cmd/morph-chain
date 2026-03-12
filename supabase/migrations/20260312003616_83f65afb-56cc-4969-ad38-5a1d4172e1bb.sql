
-- 1. Security definer function for joining matches (bypasses RLS)
CREATE OR REPLACE FUNCTION public.join_match(p_match_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_player_a uuid;
  v_first_guesser uuid;
BEGIN
  -- Validate: match must be waiting, caller must not be player_a
  SELECT player_a INTO v_player_a
  FROM morphcode_matches
  WHERE id = p_match_id AND status = 'waiting';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Match not found or not waiting';
  END IF;

  IF v_player_a = auth.uid() THEN
    RAISE EXCEPTION 'Cannot join your own match';
  END IF;

  -- Set player_b, transition to setup
  UPDATE morphcode_matches
  SET player_b = auth.uid(), status = 'setup', current_round = 1, updated_at = now()
  WHERE id = p_match_id AND status = 'waiting';

  -- Randomly pick first guesser
  IF random() < 0.5 THEN
    v_first_guesser := v_player_a;
  ELSE
    v_first_guesser := auth.uid();
  END IF;

  -- Create round 1
  INSERT INTO morphcode_rounds (match_id, round_number, first_guesser, status)
  VALUES (p_match_id, 1, v_first_guesser, 'setup');

  RETURN p_match_id;
END;
$$;

-- 2. Security definer function for expiring/declining matches
CREATE OR REPLACE FUNCTION public.expire_match(p_match_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE morphcode_matches
  SET status = 'expired', updated_at = now()
  WHERE id = p_match_id AND status = 'waiting';

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;
