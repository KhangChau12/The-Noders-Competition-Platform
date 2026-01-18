-- Fix RLS policy for team submissions
-- The issue: Need to properly reference NEW values in INSERT context while avoiding ambiguous column references

-- Drop the old policy
DROP POLICY IF EXISTS "Approved users can submit" ON submissions;

-- Create new policy with proper INSERT check
-- Reference the NEW row being inserted as 'submissions' implicitly
CREATE POLICY "Approved users can submit"
ON submissions FOR INSERT
WITH CHECK (
  submitted_by = auth.uid() AND
  (
    -- For individual submissions
    (
      submissions.user_id = auth.uid() AND
      submissions.team_id IS NULL AND
      EXISTS (
        SELECT 1 FROM registrations r
        WHERE r.user_id = auth.uid()
          AND r.competition_id = submissions.competition_id
          AND r.status = 'approved'
      )
    )
    OR
    -- For team submissions
    (
      submissions.user_id IS NULL AND
      submissions.team_id IS NOT NULL AND
      EXISTS (
        SELECT 1
        FROM team_members tm
        JOIN registrations r ON r.team_id = tm.team_id AND r.competition_id = submissions.competition_id
        WHERE tm.user_id = auth.uid()
          AND tm.team_id = submissions.team_id
          AND r.status = 'approved'
      )
    )
  )
);
