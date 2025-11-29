-- ============================================================================
-- RECALCULATE BEST SCORES FOR EXISTING SUBMISSIONS
-- ============================================================================
-- Description: Re-trigger best score calculation for all existing submissions
--              to fix any incorrect is_best_score flags from before migration 008
-- ============================================================================

-- Create a temporary function to recalculate all best scores
CREATE OR REPLACE FUNCTION recalculate_all_best_scores()
RETURNS void AS $$
DECLARE
  submission_record RECORD;
BEGIN
  -- Loop through all valid submissions and trigger the update
  FOR submission_record IN
    SELECT DISTINCT ON (competition_id, phase, COALESCE(user_id::text, team_id::text))
      id, competition_id, phase, user_id, team_id, score
    FROM submissions
    WHERE validation_status = 'valid' AND score IS NOT NULL
    ORDER BY competition_id, phase, COALESCE(user_id::text, team_id::text), submitted_at DESC
  LOOP
    -- Update the score to itself to trigger the update_best_score() function
    UPDATE submissions
    SET score = score
    WHERE id = submission_record.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the recalculation
SELECT recalculate_all_best_scores();

-- Drop the temporary function
DROP FUNCTION recalculate_all_best_scores();

-- Add a comment
COMMENT ON TABLE submissions IS 'Stores user/team submissions. Best scores are automatically calculated by trigger based on competition scoring metric.';
