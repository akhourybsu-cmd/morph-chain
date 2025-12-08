-- Add columns to admin_puzzle_vault for auto-generation tracking
ALTER TABLE public.admin_puzzle_vault 
ADD COLUMN IF NOT EXISTS generation_batch text,
ADD COLUMN IF NOT EXISTS quality_score integer DEFAULT 5,
ADD COLUMN IF NOT EXISTS last_served_date date,
ADD COLUMN IF NOT EXISTS generated_at timestamp with time zone DEFAULT now();

-- Create index for efficient daily puzzle lookup
CREATE INDEX IF NOT EXISTS idx_puzzle_vault_date_length 
ON public.admin_puzzle_vault(word_length, puzzle_index);

-- Create index for finding unserved puzzles
CREATE INDEX IF NOT EXISTS idx_puzzle_vault_unserved 
ON public.admin_puzzle_vault(word_length, last_served_date) 
WHERE is_active = true;