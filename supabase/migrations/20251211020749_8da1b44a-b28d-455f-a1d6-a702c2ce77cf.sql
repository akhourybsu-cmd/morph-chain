-- Create grid_sessions table to track all Grid game attempts
CREATE TABLE public.grid_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date_local DATE NOT NULL,
  session_id TEXT NOT NULL,
  moves INTEGER NOT NULL DEFAULT 0,
  words_used INTEGER NOT NULL DEFAULT 0,
  time_to_complete_ms INTEGER,
  completed BOOLEAN DEFAULT false,
  won BOOLEAN DEFAULT false,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, date_local)
);

-- Enable RLS
ALTER TABLE public.grid_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can insert own grid sessions"
  ON public.grid_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own grid sessions"
  ON public.grid_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own grid sessions"
  ON public.grid_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all grid sessions"
  ON public.grid_sessions FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create v_user_stats_grid view
CREATE OR REPLACE VIEW public.v_user_stats_grid
WITH (security_invoker = true) AS
SELECT
  user_id,
  COUNT(*)::int AS plays,
  COALESCE(SUM(CASE WHEN won THEN 1 ELSE 0 END), 0)::int AS wins,
  COALESCE(MIN(CASE WHEN won THEN moves END), 0)::int AS best_moves,
  COALESCE(ROUND(AVG(CASE WHEN completed THEN time_to_complete_ms END)), 0)::int AS avg_time_ms
FROM public.grid_sessions
WHERE user_id IS NOT NULL
GROUP BY user_id;

-- Drop and recreate dependent views to include grid stats
DROP VIEW IF EXISTS public.v_my_stats CASCADE;
DROP VIEW IF EXISTS public.v_user_stats_all CASCADE;

-- Recreate v_user_stats_all with grid stats
CREATE OR REPLACE VIEW public.v_user_stats_all
WITH (security_invoker = true) AS
SELECT
  p.user_id,
  COALESCE(r.plays, 0) AS rush_plays,
  COALESCE(r.best_score, 0) AS rush_best_score,
  COALESCE(r.avg_score, 0) AS rush_avg_score,
  COALESCE(r.best_multiplier, 0) AS rush_best_multiplier,
  COALESCE(r.total_ms, 0) AS rush_time_ms,
  COALESCE(c.plays, 0) AS chain_plays,
  COALESCE(c.best_moves, 0) AS chain_best_moves,
  COALESCE(c.wins, 0) AS chain_wins,
  COALESCE(c.avg_time_ms, 0) AS chain_avg_time_ms,
  COALESCE(g.plays, 0) AS grid_plays,
  COALESCE(g.wins, 0) AS grid_wins,
  COALESCE(g.best_moves, 0) AS grid_best_moves,
  COALESCE(g.avg_time_ms, 0) AS grid_avg_time_ms
FROM public.user_profiles p
LEFT JOIN v_user_stats_rush r ON r.user_id = p.user_id
LEFT JOIN v_user_stats_chain c ON c.user_id = p.user_id
LEFT JOIN v_user_stats_grid g ON g.user_id = p.user_id;

-- Recreate v_my_stats
CREATE OR REPLACE VIEW public.v_my_stats
WITH (security_invoker = true) AS
SELECT *
FROM public.v_user_stats_all
WHERE user_id = auth.uid();