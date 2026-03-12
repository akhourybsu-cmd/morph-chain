ALTER TABLE public.morphcode_matches ADD COLUMN is_bot_match boolean NOT NULL DEFAULT false;
ALTER TABLE public.clash_matches ADD COLUMN is_bot_match boolean NOT NULL DEFAULT false;