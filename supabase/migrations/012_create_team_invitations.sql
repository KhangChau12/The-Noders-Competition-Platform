-- ============================================================================
-- TEAM INVITATIONS SYSTEM
-- ============================================================================
-- Add team invitation functionality where leaders can invite users
-- and users can accept/reject invitations
-- ============================================================================

-- Create team_invitations table
CREATE TABLE team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  CONSTRAINT unique_team_invitation UNIQUE(team_id, user_id)
);

-- Indexes for performance
CREATE INDEX idx_team_invitations_team ON team_invitations(team_id);
CREATE INDEX idx_team_invitations_user ON team_invitations(user_id);
CREATE INDEX idx_team_invitations_status ON team_invitations(status);

-- RLS Policies
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view invitations sent to them
CREATE POLICY "Users can view their invitations"
  ON team_invitations
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Team leaders can view invitations for their teams
CREATE POLICY "Team leaders can view team invitations"
  ON team_invitations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_invitations.team_id
      AND teams.leader_id = auth.uid()
    )
  );

-- Policy: Team leaders can create invitations
CREATE POLICY "Team leaders can create invitations"
  ON team_invitations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_invitations.team_id
      AND teams.leader_id = auth.uid()
    )
  );

-- Policy: Users can update their own invitations (accept/reject)
CREATE POLICY "Users can respond to their invitations"
  ON team_invitations
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Team leaders can delete invitations for their teams
CREATE POLICY "Team leaders can delete invitations"
  ON team_invitations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_invitations.team_id
      AND teams.leader_id = auth.uid()
    )
  );
