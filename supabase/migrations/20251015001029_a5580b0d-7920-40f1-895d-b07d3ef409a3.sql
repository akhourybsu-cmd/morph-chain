-- Create arcade_daily table for daily Morph Mystery puzzles
CREATE TABLE IF NOT EXISTS public.arcade_daily (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date_local DATE NOT NULL UNIQUE,
  puzzle_number INTEGER NOT NULL,
  start_word TEXT NOT NULL,
  goal_word TEXT NOT NULL,
  min_distance INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.arcade_daily ENABLE ROW LEVEL SECURITY;

-- Anyone can view daily puzzles
CREATE POLICY "Anyone can view arcade daily puzzles"
ON public.arcade_daily
FOR SELECT
USING (true);

-- Only admins can manage daily puzzles
CREATE POLICY "Only admins can manage arcade daily puzzles"
ON public.arcade_daily
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create arcade_completions table to track player solutions
CREATE TABLE IF NOT EXISTS public.arcade_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  date_local DATE NOT NULL,
  moves INTEGER NOT NULL,
  word_chain JSONB NOT NULL DEFAULT '[]'::jsonb,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session_id TEXT NOT NULL
);

-- Enable RLS
ALTER TABLE public.arcade_completions ENABLE ROW LEVEL SECURITY;

-- Users can insert their own completions
CREATE POLICY "Users can insert own arcade completions"
ON public.arcade_completions
FOR INSERT
WITH CHECK ((auth.uid() = user_id) OR (user_id IS NULL));

-- Users can view their own completions
CREATE POLICY "Users can view own arcade completions"
ON public.arcade_completions
FOR SELECT
USING ((auth.uid() = user_id) OR (session_id = current_setting('app.session_id'::text, true)));

-- Admins can view all completions
CREATE POLICY "Admins can view all arcade completions"
ON public.arcade_completions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create leaderboard view for Morph Mystery
CREATE OR REPLACE VIEW public.arcade_daily_leaderboard AS
SELECT 
  ac.user_id,
  ac.date_local,
  ac.moves,
  ac.completed_at,
  up.default_initials as initials,
  ROW_NUMBER() OVER (
    PARTITION BY ac.date_local 
    ORDER BY ac.moves ASC, ac.completed_at ASC
  ) as rank
FROM public.arcade_completions ac
LEFT JOIN public.user_profiles up ON ac.user_id = up.user_id
WHERE ac.user_id IS NOT NULL
ORDER BY ac.date_local DESC, ac.moves ASC, ac.completed_at ASC;

-- Create function to get daily leaderboard
CREATE OR REPLACE FUNCTION public.get_arcade_daily_leaderboard(
  p_date DATE,
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE(
  user_id UUID,
  moves INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE,
  initials TEXT,
  rank BIGINT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT user_id, moves, completed_at, initials, rank
  FROM public.arcade_daily_leaderboard
  WHERE date_local = p_date
  ORDER BY rank
  LIMIT p_limit;
$$;