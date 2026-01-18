-- ============================================================================
-- FIX BEST SCORE TRIGGER FOR REGRESSION METRICS
-- ============================================================================
-- Description: Update best score trigger to handle regression metrics (MAE, RMSE)
--              where lower scores are better
-- ============================================================================

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS trigger_update_best_score ON submissions;
DROP FUNCTION IF EXISTS update_best_score();

-- Create improved function that handles both classification and regression metrics
CREATE OR REPLACE FUNCTION update_best_score()
RETURNS TRIGGER AS $$
DECLARE
  comp_metric TEXT;
  is_higher_better BOOLEAN;
  best_submission_id UUID;
BEGIN
  -- Get the competition's scoring metric
  SELECT scoring_metric INTO comp_metric
  FROM competitions
  WHERE id = NEW.competition_id;

  -- Determine if higher scores are better based on metric type
  is_higher_better := CASE
    WHEN comp_metric IN ('f1_score', 'accuracy', 'precision', 'recall') THEN TRUE
    WHEN comp_metric IN ('mae', 'rmse') THEN FALSE
    ELSE TRUE -- Default to higher is better
  END;

  -- Reset all previous best scores for this participant in this phase
  IF NEW.user_id IS NOT NULL THEN
    UPDATE submissions
    SET is_best_score = FALSE
    WHERE competition_id = NEW.competition_id
      AND phase = NEW.phase
      AND user_id = NEW.user_id
      AND id != NEW.id;

    -- Find and set the best score based on metric type
    IF is_higher_better THEN
      -- For classification metrics: highest score wins
      SELECT id INTO best_submission_id
      FROM submissions
      WHERE competition_id = NEW.competition_id
        AND phase = NEW.phase
        AND user_id = NEW.user_id
        AND validation_status = 'valid'
        AND score IS NOT NULL
      ORDER BY score DESC NULLS LAST, submitted_at ASC
      LIMIT 1;
    ELSE
      -- For regression metrics: lowest score wins
      SELECT id INTO best_submission_id
      FROM submissions
      WHERE competition_id = NEW.competition_id
        AND phase = NEW.phase
        AND user_id = NEW.user_id
        AND validation_status = 'valid'
        AND score IS NOT NULL
      ORDER BY score ASC NULLS LAST, submitted_at ASC
      LIMIT 1;
    END IF;

    -- Mark the best submission
    IF best_submission_id IS NOT NULL THEN
      UPDATE submissions
      SET is_best_score = TRUE
      WHERE id = best_submission_id;
    END IF;

  ELSE
    -- Handle team submissions
    UPDATE submissions
    SET is_best_score = FALSE
    WHERE competition_id = NEW.competition_id
      AND phase = NEW.phase
      AND team_id = NEW.team_id
      AND id != NEW.id;

    -- Find and set the best score based on metric type
    IF is_higher_better THEN
      -- For classification metrics: highest score wins
      SELECT id INTO best_submission_id
      FROM submissions
      WHERE competition_id = NEW.competition_id
        AND phase = NEW.phase
        AND team_id = NEW.team_id
        AND validation_status = 'valid'
        AND score IS NOT NULL
      ORDER BY score DESC NULLS LAST, submitted_at ASC
      LIMIT 1;
    ELSE
      -- For regression metrics: lowest score wins
      SELECT id INTO best_submission_id
      FROM submissions
      WHERE competition_id = NEW.competition_id
        AND phase = NEW.phase
        AND team_id = NEW.team_id
        AND validation_status = 'valid'
        AND score IS NOT NULL
      ORDER BY score ASC NULLS LAST, submitted_at ASC
      LIMIT 1;
    END IF;

    -- Mark the best submission
    IF best_submission_id IS NOT NULL THEN
      UPDATE submissions
      SET is_best_score = TRUE
      WHERE id = best_submission_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER trigger_update_best_score
  AFTER INSERT OR UPDATE OF score ON submissions
  FOR EACH ROW
  WHEN (NEW.validation_status = 'valid')
  EXECUTE FUNCTION update_best_score();

-- Add comment explaining the trigger logic
COMMENT ON FUNCTION update_best_score() IS 'Automatically marks the best submission for each user/team based on scoring metric type. For classification metrics (f1_score, accuracy, precision, recall), higher is better. For regression metrics (mae, rmse), lower is better.';
