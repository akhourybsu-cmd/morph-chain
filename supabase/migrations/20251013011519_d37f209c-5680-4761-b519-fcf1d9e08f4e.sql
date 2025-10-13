-- Fix rush_best_runs and rush_daily_leaderboard to handle anonymous users properly
-- The issue: DISTINCT ON (user_id, ...) groups all NULL user_ids together
-- Solution: Use COALESCE(user_id::text, session_id) to distinguish anonymous players

DROP VIEW IF EXISTS public.rush_daily_leaderboard CASCADE;
DROP VIEW IF EXISTS public.rush_best_runs CASCADE;

-- View: Best run per player (user or session) per day/mode
CREATE OR REPLACE VIEW public.rush_best_runs
WITH (security_invoker = on)
AS
SELECT DISTINCT ON (COALESCE(user_id::text, session_id), date_local, mode, hard_mode)
  id,
  user_id,
  session_id,
  date_local,
  mode,
  score,
  multiplier_max,
  invalid_count,
  hard_mode,
  initials,
  finished_at
FROM public.rush_runs
WHERE official_status = 'finished'
ORDER BY COALESCE(user_id::text, session_id), date_local, mode, hard_mode, score DESC, multiplier_max DESC, finished_at ASC;

-- View: Daily leaderboard with rankings (including initials)
-- Separate leaderboards for hard mode vs normal mode
CREATE OR REPLACE VIEW public.rush_daily_leaderboard
WITH (security_invoker = on)
AS
SELECT
  date_local,
  mode,
  user_id,
  score,
  multiplier_max,
  hard_mode,
  initials,
  finished_at,
  ROW_NUMBER() OVER (
    PARTITION BY date_local, mode, hard_mode 
    ORDER BY score DESC, multiplier_max DESC, finished_at ASC
  ) AS rank
FROM public.rush_best_runs;