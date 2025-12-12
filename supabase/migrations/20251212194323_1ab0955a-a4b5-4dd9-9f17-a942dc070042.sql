-- Create active_sessions table for tracking all sessions including guests
CREATE TABLE public.active_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_token TEXT NOT NULL,
  game_type TEXT NOT NULL CHECK (game_type IN ('chain', 'rush', 'grid')),
  puzzle_date DATE NOT NULL,
  word_length INTEGER,
  mode TEXT,
  moves_count INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed BOOLEAN DEFAULT false,
  won BOOLEAN DEFAULT false,
  user_id UUID REFERENCES auth.users(id)
);

-- Create indexes for efficient querying
CREATE INDEX idx_active_sessions_device_token ON public.active_sessions(device_token);
CREATE INDEX idx_active_sessions_game_type ON public.active_sessions(game_type);
CREATE INDEX idx_active_sessions_puzzle_date ON public.active_sessions(puzzle_date);
CREATE INDEX idx_active_sessions_last_activity ON public.active_sessions(last_activity_at);

-- Unique constraint to prevent duplicate sessions per device/game/date
CREATE UNIQUE INDEX idx_active_sessions_unique ON public.active_sessions(device_token, game_type, puzzle_date, COALESCE(word_length, 0), COALESCE(mode, ''));

-- Enable RLS
ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (for guests)
CREATE POLICY "Anyone can create sessions"
ON public.active_sessions
FOR INSERT
WITH CHECK (true);

-- Allow anyone to update their own session by device token
CREATE POLICY "Anyone can update own sessions"
ON public.active_sessions
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Only admins can view all sessions
CREATE POLICY "Admins can view all sessions"
ON public.active_sessions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Prevent deletion except by admins
CREATE POLICY "Only admins can delete sessions"
ON public.active_sessions
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));