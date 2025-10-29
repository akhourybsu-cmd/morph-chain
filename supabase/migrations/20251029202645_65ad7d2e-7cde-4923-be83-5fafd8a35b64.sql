-- Create Grid daily leaderboard table
CREATE TABLE IF NOT EXISTS public.grid_daily_leaderboard (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  date_local date NOT NULL,
  moves integer NOT NULL,
  words_used integer NOT NULL,
  time_to_complete_ms integer,
  completed_at timestamptz NOT NULL DEFAULT now(),
  initials text,
  rank bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT grid_daily_leaderboard_user_date_unique UNIQUE (user_id, date_local)
);

-- Enable RLS
ALTER TABLE public.grid_daily_leaderboard ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read the leaderboard
CREATE POLICY "Grid leaderboard is publicly readable"
ON public.grid_daily_leaderboard
FOR SELECT
USING (true);

-- Allow authenticated users to insert their own scores
CREATE POLICY "Users can submit their own grid scores"
ON public.grid_daily_leaderboard
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_grid_daily_leaderboard_date 
ON public.grid_daily_leaderboard(date_local);

CREATE INDEX IF NOT EXISTS idx_grid_daily_leaderboard_user_date 
ON public.grid_daily_leaderboard(user_id, date_local);

-- Create function to get Grid daily leaderboard with ranking
CREATE OR REPLACE FUNCTION public.get_grid_daily_leaderboard(
  p_date date,
  p_limit integer DEFAULT 100
)
RETURNS TABLE(
  user_id uuid,
  moves integer,
  words_used integer,
  time_to_complete_ms integer,
  completed_at timestamptz,
  initials text,
  rank bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $function$
  WITH ranked_entries AS (
    SELECT 
      grid_daily_leaderboard.user_id,
      grid_daily_leaderboard.moves,
      grid_daily_leaderboard.words_used,
      grid_daily_leaderboard.time_to_complete_ms,
      grid_daily_leaderboard.completed_at,
      grid_daily_leaderboard.initials,
      ROW_NUMBER() OVER (
        ORDER BY 
          grid_daily_leaderboard.moves ASC,
          grid_daily_leaderboard.time_to_complete_ms ASC NULLS LAST,
          grid_daily_leaderboard.completed_at ASC
      ) as rank
    FROM public.grid_daily_leaderboard
    WHERE date_local = p_date
  )
  SELECT *
  FROM ranked_entries
  ORDER BY rank
  LIMIT LEAST(p_limit, 100);
$function$;