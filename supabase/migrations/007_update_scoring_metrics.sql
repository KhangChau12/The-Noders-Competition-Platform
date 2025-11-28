-- ============================================================================
-- UPDATE SCORING METRICS
-- ============================================================================
-- Description: Add support for more scoring metrics (MAE, RMSE, Precision, Recall)
-- ============================================================================

-- Drop existing constraint on scoring_metric
ALTER TABLE competitions
DROP CONSTRAINT IF EXISTS competitions_scoring_metric_check;

-- Add new constraint with all supported metrics
ALTER TABLE competitions
ADD CONSTRAINT competitions_scoring_metric_check
CHECK (scoring_metric IN ('f1_score', 'accuracy', 'precision', 'recall', 'mae', 'rmse'));

-- Add comment to explain the metrics
COMMENT ON COLUMN competitions.scoring_metric IS 'Scoring metric used for evaluation. Classification: f1_score, accuracy, precision, recall. Regression: mae, rmse. Higher is better except for mae and rmse.';
