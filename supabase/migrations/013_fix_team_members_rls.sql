-- Fix RLS policy for team_members to allow users to accept invitations
-- Drop the old policy
DROP POLICY IF EXISTS "Team leaders can add members" ON team_members;

-- Create new policy that allows both:
-- 1. Team leaders to add members directly
-- 2. Users to add themselves when accepting an invitation
CREATE POLICY "Team leaders can add members or users can accept invitations"
ON team_members FOR INSERT
WITH CHECK (
  -- Team leader adding a member
  EXISTS (
    SELECT 1 FROM teams
    WHERE teams.id = team_id AND teams.leader_id = auth.uid()
  )
  OR
  -- User accepting an invitation (adding themselves)
  (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM team_invitations
      WHERE team_invitations.team_id = team_members.team_id
        AND team_invitations.user_id = auth.uid()
        AND team_invitations.status = 'pending'
    )
  )
);
