-- Security enhancements for leaderboard and word feedback
-- Based on comprehensive security audit 2025-10-13

-- ================================
-- 1. Add constraints for rush_runs integrity (anti-cheat)
-- ================================

-- Add constraint for initials format (3 uppercase alphanumeric characters)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'rush_runs_initials_format_check'
  ) THEN
    ALTER TABLE public.rush_runs
      ADD CONSTRAINT rush_runs_initials_format_check 
      CHECK (initials IS NULL OR initials ~ '^[A-Z0-9]{3}$');
  END IF;
END $$;

-- Add constraint for score bounds (prevent obviously fraudulent scores)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'rush_runs_score_bounds_check'
  ) THEN
    ALTER TABLE public.rush_runs
      ADD CONSTRAINT rush_runs_score_bounds_check 
      CHECK (score >= 0 AND score <= 200000);
  END IF;
END $$;

-- Add constraint for multiplier bounds (prevent manipulation)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'rush_runs_multiplier_bounds_check'
  ) THEN
    ALTER TABLE public.rush_runs
      ADD CONSTRAINT rush_runs_multiplier_bounds_check 
      CHECK (multiplier_max >= 1 AND multiplier_max <= 50);
  END IF;
END $$;

-- ================================
-- 2. Create word_feedback table for user complaints
-- ================================

-- This replaces direct client writes to admin_dictionary
-- Users submit feedback here, admins can review and act on it
CREATE TABLE IF NOT EXISTS public.word_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  word TEXT NOT NULL,
  word_length INTEGER NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_word_feedback_word ON public.word_feedback(word);
CREATE INDEX IF NOT EXISTS idx_word_feedback_status ON public.word_feedback(status);
CREATE INDEX IF NOT EXISTS idx_word_feedback_user ON public.word_feedback(user_id);

-- Enable RLS
ALTER TABLE public.word_feedback ENABLE ROW LEVEL SECURITY;

-- Users can insert their own feedback
CREATE POLICY "Users can submit word feedback"
  ON public.word_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own feedback
CREATE POLICY "Users can view own feedback"
  ON public.word_feedback
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all feedback
CREATE POLICY "Admins can view all feedback"
  ON public.word_feedback
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update feedback (review, approve, reject)
CREATE POLICY "Admins can update feedback"
  ON public.word_feedback
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_word_feedback_updated_at
  BEFORE UPDATE ON public.word_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();