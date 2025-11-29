-- Check current best score assignments for MAE competition
SELECT 
  s.id,
  s.score,
  s.is_best_score,
  s.validation_status,
  s.submitted_at,
  c.scoring_metric,
  u.email
FROM submissions s
JOIN competitions c ON s.competition_id = c.id
JOIN users u ON s.user_id = u.id
WHERE c.scoring_metric = 'mae'
ORDER BY s.user_id, s.score ASC;
