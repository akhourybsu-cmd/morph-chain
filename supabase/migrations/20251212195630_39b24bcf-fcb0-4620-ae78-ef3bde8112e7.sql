-- Add unique constraint for upsert to work on backfill
ALTER TABLE public.active_sessions 
ADD CONSTRAINT active_sessions_device_game_date_unique 
UNIQUE (device_token, game_type, puzzle_date);