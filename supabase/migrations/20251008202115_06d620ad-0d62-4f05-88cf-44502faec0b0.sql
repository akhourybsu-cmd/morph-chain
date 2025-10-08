-- Morph Rush Database Tables

-- Store the daily start word selection
CREATE TABLE IF NOT EXISTS public.rush_daily (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date_local DATE NOT NULL UNIQUE,
  puzzle_number INTEGER NOT NULL,
  start_word TEXT NOT NULL,
  start_degree INTEGER,
  health_score NUMERIC,
  status TEXT NOT NULL DEFAULT 'live',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Store player runs
CREATE TABLE IF NOT EXISTS public.rush_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT NOT NULL,
  date_local DATE NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('daily', 'practice')),
  official_status TEXT NOT NULL DEFAULT 'unstarted' CHECK (official_status IN ('unstarted', 'official', 'finished', 'forfeited')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  finished_at TIMESTAMP WITH TIME ZONE,
  words JSONB NOT NULL DEFAULT '[]'::jsonb,
  score INTEGER NOT NULL DEFAULT 0,
  multiplier_max NUMERIC NOT NULL DEFAULT 1.0,
  invalid_count INTEGER NOT NULL DEFAULT 0,
  scout_used BOOLEAN NOT NULL DEFAULT false,
  undo_used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rush_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rush_runs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rush_daily
CREATE POLICY "Anyone can view daily puzzles"
  ON public.rush_daily
  FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage daily puzzles"
  ON public.rush_daily
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for rush_runs
CREATE POLICY "Users can view own runs"
  ON public.rush_runs
  FOR SELECT
  USING (auth.uid() = user_id OR session_id = current_setting('app.session_id', true));

CREATE POLICY "Users can insert own runs"
  ON public.rush_runs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own runs"
  ON public.rush_runs
  FOR UPDATE
  USING (auth.uid() = user_id OR session_id = current_setting('app.session_id', true));

CREATE POLICY "Admins can view all runs"
  ON public.rush_runs
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rush_daily_date ON public.rush_daily(date_local);
CREATE INDEX IF NOT EXISTS idx_rush_runs_user_date ON public.rush_runs(user_id, date_local);
CREATE INDEX IF NOT EXISTS idx_rush_runs_session ON public.rush_runs(session_id);
CREATE INDEX IF NOT EXISTS idx_rush_runs_mode_status ON public.rush_runs(mode, official_status);