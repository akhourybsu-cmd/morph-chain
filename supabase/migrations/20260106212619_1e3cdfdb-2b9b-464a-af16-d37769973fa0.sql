-- Create measured_fact_bank table for storing verified real-world facts
CREATE TABLE public.measured_fact_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  clue_text TEXT NOT NULL,
  canonical_value_int INTEGER NOT NULL,
  unit_label TEXT NOT NULL,
  category TEXT NOT NULL,
  rounding_note TEXT,
  reveal_blurb TEXT NOT NULL,
  source_1 TEXT NOT NULL,
  source_2 TEXT,
  verified_at TIMESTAMPTZ,
  verified_by TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'verified', 'retired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create measured_puzzle_templates table (fixed equation template)
CREATE TABLE public.measured_puzzle_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT NOT NULL UNIQUE,
  equation_display TEXT NOT NULL DEFAULT '□ × □ + □ − □',
  slot_count INTEGER NOT NULL DEFAULT 4,
  operators JSONB NOT NULL DEFAULT '["*", "+", "-"]'::jsonb,
  tile_count INTEGER NOT NULL DEFAULT 10,
  min_tile INTEGER NOT NULL DEFAULT 1,
  max_tile INTEGER NOT NULL DEFAULT 25,
  allow_negative_intermediate BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create measured_daily_puzzles table
CREATE TABLE public.measured_daily_puzzles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  puzzle_date DATE NOT NULL UNIQUE,
  fact_id UUID NOT NULL REFERENCES public.measured_fact_bank(id),
  template_id UUID NOT NULL REFERENCES public.measured_puzzle_templates(id),
  target_value_int INTEGER NOT NULL,
  tiles JSONB NOT NULL,
  solution JSONB NOT NULL,
  difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  seed TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create measured_attempts table with unique constraint for one attempt per user per puzzle
CREATE TABLE public.measured_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  puzzle_id UUID NOT NULL REFERENCES public.measured_daily_puzzles(id),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  chosen JSONB NOT NULL,
  result_value_int INTEGER NOT NULL,
  error_abs_int INTEGER NOT NULL,
  score_int INTEGER NOT NULL,
  band TEXT NOT NULL CHECK (band IN ('Dead On', 'Sharp', 'Close', 'Warm', 'Wide')),
  is_exact BOOLEAN NOT NULL DEFAULT false,
  share_string TEXT NOT NULL,
  UNIQUE (user_id, puzzle_id)
);

-- Enable RLS on all tables
ALTER TABLE public.measured_fact_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.measured_puzzle_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.measured_daily_puzzles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.measured_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for measured_fact_bank (admin only)
CREATE POLICY "Only admins can manage fact bank"
ON public.measured_fact_bank
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for measured_puzzle_templates (admin only)
CREATE POLICY "Only admins can manage puzzle templates"
ON public.measured_puzzle_templates
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for measured_daily_puzzles
CREATE POLICY "Anyone can view published puzzles"
ON public.measured_daily_puzzles
FOR SELECT
USING (is_published = true);

CREATE POLICY "Admins can manage all puzzles"
ON public.measured_daily_puzzles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for measured_attempts
CREATE POLICY "Users can view own attempts"
ON public.measured_attempts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own attempts"
ON public.measured_attempts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all attempts"
ON public.measured_attempts
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_measured_fact_bank_updated_at
  BEFORE UPDATE ON public.measured_fact_bank
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_measured_daily_puzzles_updated_at
  BEFORE UPDATE ON public.measured_daily_puzzles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert the default puzzle template
INSERT INTO public.measured_puzzle_templates (template_key, equation_display, slot_count, operators, tile_count, min_tile, max_tile, allow_negative_intermediate)
VALUES ('ABCD_v1', '□ × □ + □ − □', 4, '["*", "+", "-"]'::jsonb, 10, 1, 25, false);