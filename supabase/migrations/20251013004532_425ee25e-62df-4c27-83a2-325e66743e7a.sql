-- Fix security definer views by using security invoker
DROP VIEW IF EXISTS public.rush_daily_leaderboard CASCADE;
DROP VIEW IF EXISTS public.rush_best_runs CASCADE;

-- View: Best run per user/day/mode (security invoker)
CREATE OR REPLACE VIEW public.rush_best_runs
WITH (security_invoker = on)
AS
SELECT DISTINCT ON (user_id, date_local, mode)
  id,
  user_id,
  session_id,
  date_local,
  mode,
  score,
  multiplier_max,
  invalid_count,
  hard_mode,
  finished_at
FROM public.rush_runs
WHERE official_status = 'finished'
ORDER BY user_id, date_local, mode, score DESC, multiplier_max DESC, finished_at ASC;

-- View: Daily leaderboard with rankings (security invoker)
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
  finished_at,
  ROW_NUMBER() OVER (
    PARTITION BY date_local, mode 
    ORDER BY score DESC, multiplier_max DESC, finished_at ASC
  ) as rank
FROM public.rush_best_runs;