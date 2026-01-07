-- Allow anyone to read facts that are used by published puzzles
CREATE POLICY "Anyone can view facts used by published puzzles"
ON measured_fact_bank
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM measured_daily_puzzles
    WHERE measured_daily_puzzles.fact_id = measured_fact_bank.id
    AND measured_daily_puzzles.is_published = true
  )
);