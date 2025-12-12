-- Fix 1: Drop views in correct order (dependents first) and recreate with security_invoker
DROP VIEW IF EXISTS public.v_my_stats;
DROP VIEW IF EXISTS public.v_user_stats_all;
DROP VIEW IF EXISTS public.v_user_engagement;
DROP VIEW IF EXISTS public.v_user_stats_rush;
DROP VIEW IF EXISTS public.v_user_stats_chain;
DROP VIEW IF EXISTS public.v_user_stats_grid;

-- Recreate v_user_stats_rush
CREATE VIEW public.v_user_stats_rush
WITH (security_invoker = true)
AS
SELECT 
  user_id,
  COUNT(*)::integer as plays,
  MAX(score) as best_score,
  AVG(score)::integer as avg_score,
  MAX(multiplier_max) as best_multiplier,
  SUM(EXTRACT(EPOCH FROM (finished_at - started_at)) * 1000)::bigint as total_ms
FROM public.rush_runs
WHERE finished_at IS NOT NULL
GROUP BY user_id;

-- Recreate v_user_stats_chain
CREATE VIEW public.v_user_stats_chain
WITH (security_invoker = true)
AS
SELECT 
  user_id,
  COUNT(*)::integer as plays,
  MIN(CASE WHEN won = true THEN jsonb_array_length(moves) END)::integer as best_moves,
  COUNT(CASE WHEN won = true THEN 1 END)::integer as wins,
  AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) * 1000)::integer as avg_time_ms
FROM public.player_sessions
WHERE completed = true
GROUP BY user_id;

-- Recreate v_user_stats_grid
CREATE VIEW public.v_user_stats_grid
WITH (security_invoker = true)
AS
SELECT 
  user_id,
  COUNT(*)::integer as plays,
  COUNT(CASE WHEN won = true THEN 1 END)::integer as wins,
  MIN(CASE WHEN won = true THEN moves END)::integer as best_moves,
  AVG(time_to_complete_ms)::integer as avg_time_ms
FROM public.grid_sessions
WHERE completed = true
GROUP BY user_id;

-- Recreate v_user_stats_all
CREATE VIEW public.v_user_stats_all
WITH (security_invoker = true)
AS
SELECT 
  COALESCE(r.user_id, c.user_id, g.user_id) as user_id,
  r.plays as rush_plays,
  r.best_score as rush_best_score,
  r.avg_score as rush_avg_score,
  r.best_multiplier as rush_best_multiplier,
  r.total_ms as rush_time_ms,
  c.plays as chain_plays,
  c.best_moves as chain_best_moves,
  c.wins as chain_wins,
  c.avg_time_ms as chain_avg_time_ms,
  g.plays as grid_plays,
  g.wins as grid_wins,
  g.best_moves as grid_best_moves,
  g.avg_time_ms as grid_avg_time_ms
FROM public.v_user_stats_rush r
FULL OUTER JOIN public.v_user_stats_chain c ON r.user_id = c.user_id
FULL OUTER JOIN public.v_user_stats_grid g ON COALESCE(r.user_id, c.user_id) = g.user_id;

-- Recreate v_my_stats
CREATE VIEW public.v_my_stats
WITH (security_invoker = true)
AS
SELECT * FROM public.v_user_stats_all
WHERE user_id = auth.uid();

-- Recreate v_user_engagement
CREATE VIEW public.v_user_engagement
WITH (security_invoker = true)
AS
SELECT 
  COALESCE(c.user_id, r.user_id, g.user_id) as user_id,
  c.chain_days_played,
  r.rush_days_played,
  g.grid_days_played,
  COALESCE(c.chain_days_played, 0) + COALESCE(r.rush_days_played, 0) + COALESCE(g.grid_days_played, 0) as total_days_played,
  GREATEST(c.last_chain_date, r.last_rush_date, g.last_grid_date) as last_active_date
FROM (
  SELECT user_id, COUNT(DISTINCT puzzle_date)::bigint as chain_days_played, MAX(puzzle_date) as last_chain_date
  FROM public.player_sessions GROUP BY user_id
) c
FULL OUTER JOIN (
  SELECT user_id, COUNT(DISTINCT date_local)::bigint as rush_days_played, MAX(date_local) as last_rush_date
  FROM public.rush_runs GROUP BY user_id
) r ON c.user_id = r.user_id
FULL OUTER JOIN (
  SELECT user_id, COUNT(DISTINCT date_local)::bigint as grid_days_played, MAX(date_local) as last_grid_date
  FROM public.grid_sessions GROUP BY user_id
) g ON COALESCE(c.user_id, r.user_id) = g.user_id;

-- Fix 2: Tighten active_sessions RLS policies
DROP POLICY IF EXISTS "Anyone can create sessions" ON public.active_sessions;
DROP POLICY IF EXISTS "Anyone can update own sessions" ON public.active_sessions;

CREATE POLICY "Insert sessions with valid data"
ON public.active_sessions FOR INSERT
WITH CHECK (
  device_token ~ '^[a-f0-9-]{36}$' AND
  game_type IN ('chain', 'rush', 'grid') AND
  (mode IS NULL OR mode IN ('normal', 'hard', 'daily', 'practice', 'archive'))
);

CREATE POLICY "Update sessions by device token"
ON public.active_sessions FOR UPDATE
USING (true)
WITH CHECK (
  device_token ~ '^[a-f0-9-]{36}$' AND
  game_type IN ('chain', 'rush', 'grid')
);