-- Update active_sessions RLS policies to include 'alibi' game type
DROP POLICY IF EXISTS "Insert sessions with valid data" ON public.active_sessions;
DROP POLICY IF EXISTS "Update sessions by device token" ON public.active_sessions;

CREATE POLICY "Insert sessions with valid data"
ON public.active_sessions FOR INSERT
WITH CHECK (
  device_token ~ '^[a-f0-9-]{36}$' AND
  game_type IN ('chain', 'rush', 'grid', 'alibi') AND
  (mode IS NULL OR mode IN ('normal', 'hard', 'daily', 'practice', 'archive'))
);

CREATE POLICY "Update sessions by device token"
ON public.active_sessions FOR UPDATE
USING (true)
WITH CHECK (
  device_token ~ '^[a-f0-9-]{36}$' AND
  game_type IN ('chain', 'rush', 'grid', 'alibi')
);