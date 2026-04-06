-- ============================================================================
-- PRACTICE SUBMISSIONS - TABLES, TRIGGERS, VIEWS & RLS
-- ============================================================================
-- Description: Create practice_test_datasets, practice_submissions,
--              best-score trigger, participant count view, and RLS policies
-- ============================================================================

-- ============================================================================
-- TABLE: practice_test_datasets
-- ============================================================================

CREATE TABLE practice_test_datasets (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id  UUID NOT NULL REFERENCES practice_problems(id) ON DELETE CASCADE,
  file_path   TEXT NOT NULL,
  file_name   TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID NOT NULL REFERENCES users(id),
  CONSTRAINT unique_practice_dataset UNIQUE(problem_id)
);

-- Indexes
CREATE INDEX idx_practice_test_datasets_problem ON practice_test_datasets(problem_id);

-- ============================================================================
-- TABLE: practice_submissions
-- ============================================================================

CREATE TABLE practice_submissions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id        UUID NOT NULL REFERENCES practice_problems(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_path         TEXT NOT NULL,
  file_name         TEXT NOT NULL,
  file_size_bytes   INTEGER NOT NULL,
  score             NUMERIC(10, 6),
  is_best_score     BOOLEAN NOT NULL DEFAULT FALSE,
  validation_status TEXT NOT NULL DEFAULT 'pending'
                      CHECK (validation_status IN ('pending', 'valid', 'invalid')),
  validation_errors JSONB,
  submitted_at      TIMESTAMPTZ DEFAULT NOW(),
  processed_at      TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_practice_submissions_problem     ON practice_submissions(problem_id);
CREATE INDEX idx_practice_submissions_user        ON practice_submissions(user_id);
CREATE INDEX idx_practice_submissions_submitted   ON practice_submissions(submitted_at DESC);
CREATE INDEX idx_practice_submissions_best        ON practice_submissions(is_best_score) WHERE is_best_score = TRUE;
CREATE INDEX idx_practice_leaderboard             ON practice_submissions(problem_id, is_best_score) WHERE is_best_score = TRUE;

-- ============================================================================
-- TRIGGER: update_practice_best_score
-- Mirrors the competition update_best_score trigger (migration 009).
-- Handles both higher-is-better (classification) and lower-is-better (regression).
-- ============================================================================

CREATE OR REPLACE FUNCTION update_practice_best_score()
RETURNS TRIGGER AS $$
DECLARE
  prob_metric        TEXT;
  is_higher_better   BOOLEAN;
  best_submission_id UUID;
BEGIN
  -- Get the practice problem's scoring metric
  SELECT scoring_metric INTO prob_metric
  FROM practice_problems
  WHERE id = NEW.problem_id;

  -- Determine sort direction based on metric type
  is_higher_better := CASE
    WHEN prob_metric IN ('f1_score', 'accuracy', 'precision', 'recall') THEN TRUE
    WHEN prob_metric IN ('mae', 'rmse') THEN FALSE
    ELSE TRUE
  END;

  -- Reset all previous best scores for this user on this problem
  UPDATE practice_submissions
  SET is_best_score = FALSE
  WHERE problem_id = NEW.problem_id
    AND user_id    = NEW.user_id
    AND id        != NEW.id;

  -- Find the best valid submission
  IF is_higher_better THEN
    SELECT id INTO best_submission_id
    FROM practice_submissions
    WHERE problem_id        = NEW.problem_id
      AND user_id           = NEW.user_id
      AND validation_status = 'valid'
      AND score IS NOT NULL
    ORDER BY score DESC NULLS LAST, submitted_at ASC
    LIMIT 1;
  ELSE
    SELECT id INTO best_submission_id
    FROM practice_submissions
    WHERE problem_id        = NEW.problem_id
      AND user_id           = NEW.user_id
      AND validation_status = 'valid'
      AND score IS NOT NULL
    ORDER BY score ASC NULLS LAST, submitted_at ASC
    LIMIT 1;
  END IF;

  -- Mark the best submission
  IF best_submission_id IS NOT NULL THEN
    UPDATE practice_submissions
    SET is_best_score = TRUE
    WHERE id = best_submission_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_practice_best_score() IS
  'Automatically marks the best practice submission for each user. '
  'For classification metrics (f1_score, accuracy, precision, recall), higher is better. '
  'For regression metrics (mae, rmse), lower is better.';

CREATE TRIGGER trigger_update_practice_best_score
  AFTER INSERT OR UPDATE OF score ON practice_submissions
  FOR EACH ROW
  WHEN (NEW.validation_status = 'valid')
  EXECUTE FUNCTION update_practice_best_score();

-- ============================================================================
-- VIEW: practice_problem_submission_counts
-- Mirrors competition_participant_counts view. Used on browse/detail pages.
-- ============================================================================

CREATE VIEW practice_problem_submission_counts AS
SELECT
  problem_id,
  COUNT(DISTINCT user_id)                                          AS participant_count,
  COUNT(*) FILTER (WHERE validation_status = 'valid')             AS valid_submission_count,
  COUNT(*)                                                         AS total_submission_count
FROM practice_submissions
GROUP BY problem_id;

GRANT SELECT ON practice_problem_submission_counts TO authenticated, anon;

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE practice_test_datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_submissions    ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: practice_test_datasets (admin only)
-- ============================================================================

CREATE POLICY "Admins can manage practice test datasets"
ON practice_test_datasets FOR ALL
TO authenticated
USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- ============================================================================
-- RLS POLICIES: practice_submissions
-- ============================================================================

-- Users can see their own submissions
CREATE POLICY "Users can view own practice submissions"
ON practice_submissions FOR SELECT
USING (user_id = auth.uid());

-- Any authenticated user can submit to practice problems (no registration needed)
CREATE POLICY "Authenticated users can submit to practice"
ON practice_submissions FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Leaderboard: anyone (including anon) can see best scores
CREATE POLICY "Public can view practice leaderboard"
ON practice_submissions FOR SELECT
USING (is_best_score = TRUE);

-- Admins can view all submissions
CREATE POLICY "Admins can view all practice submissions"
ON practice_submissions FOR SELECT
USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- ============================================================================
-- END OF MIGRATION 021
-- ============================================================================
