-- ============================================================================
-- AI COMPETITION PLATFORM - DATABASE SCHEMA
-- ============================================================================
-- Organization: The Noders PTNK
-- Version: 1.0
-- Description: Complete database schema with RLS policies
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TABLE: users
-- ============================================================================

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Trigger for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to sync auth.users to public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    'user',
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- TABLE: teams
-- ============================================================================

CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  leader_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_team_name UNIQUE(name)
);

-- Indexes
CREATE INDEX idx_teams_leader ON teams(leader_id);
CREATE INDEX idx_teams_name ON teams(name);

-- Trigger for updated_at
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: team_members
-- ============================================================================

CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_team_user UNIQUE(team_id, user_id)
);

-- Indexes
CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);

-- ============================================================================
-- TABLE: competitions
-- ============================================================================

CREATE TABLE competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  problem_statement TEXT,

  -- Competition type
  competition_type TEXT NOT NULL CHECK (competition_type IN ('3-phase', '4-phase')),
  participation_type TEXT NOT NULL CHECK (participation_type IN ('individual', 'team')),

  -- Timeline
  registration_start TIMESTAMPTZ NOT NULL,
  registration_end TIMESTAMPTZ NOT NULL,
  public_test_start TIMESTAMPTZ NOT NULL,
  public_test_end TIMESTAMPTZ NOT NULL,
  private_test_start TIMESTAMPTZ,
  private_test_end TIMESTAMPTZ,

  -- Submission rules
  daily_submission_limit INTEGER NOT NULL DEFAULT 5,
  total_submission_limit INTEGER NOT NULL DEFAULT 50,
  max_file_size_mb INTEGER NOT NULL DEFAULT 10,

  -- Team settings
  min_team_size INTEGER DEFAULT 1,
  max_team_size INTEGER DEFAULT 3,

  -- Scoring
  scoring_metric TEXT NOT NULL DEFAULT 'f1_score',

  -- Dataset
  dataset_url TEXT,

  -- Metadata
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_competitions_type ON competitions(competition_type);
CREATE INDEX idx_competitions_participation ON competitions(participation_type);
CREATE INDEX idx_competitions_created_by ON competitions(created_by);
CREATE INDEX idx_competitions_deleted ON competitions(deleted_at);

-- Trigger for updated_at
CREATE TRIGGER update_competitions_updated_at
  BEFORE UPDATE ON competitions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to get current competition phase
CREATE OR REPLACE FUNCTION get_competition_phase(comp_id UUID)
RETURNS TEXT AS $$
DECLARE
  comp competitions%ROWTYPE;
  now_time TIMESTAMPTZ := NOW();
BEGIN
  SELECT * INTO comp FROM competitions WHERE id = comp_id;

  IF now_time < comp.registration_start THEN
    RETURN 'upcoming';
  ELSIF now_time >= comp.registration_start AND now_time < comp.registration_end THEN
    RETURN 'registration';
  ELSIF now_time >= comp.public_test_start AND now_time < comp.public_test_end THEN
    RETURN 'public_test';
  ELSIF comp.competition_type = '4-phase' AND now_time >= comp.private_test_start AND now_time < comp.private_test_end THEN
    RETURN 'private_test';
  ELSE
    RETURN 'ended';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TABLE: test_datasets
-- ============================================================================

CREATE TABLE test_datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  phase TEXT NOT NULL CHECK (phase IN ('public', 'private')),
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID NOT NULL REFERENCES users(id),
  CONSTRAINT unique_competition_phase UNIQUE(competition_id, phase)
);

-- Indexes
CREATE INDEX idx_test_datasets_competition ON test_datasets(competition_id);

-- ============================================================================
-- TABLE: registrations
-- ============================================================================

CREATE TABLE registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,

  -- Individual or Team registration
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),

  -- Timestamps
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id),

  -- Constraints
  CONSTRAINT check_user_or_team CHECK (
    (user_id IS NOT NULL AND team_id IS NULL) OR
    (user_id IS NULL AND team_id IS NOT NULL)
  ),
  CONSTRAINT unique_user_competition UNIQUE(competition_id, user_id),
  CONSTRAINT unique_team_competition UNIQUE(competition_id, team_id)
);

-- Indexes
CREATE INDEX idx_registrations_competition ON registrations(competition_id);
CREATE INDEX idx_registrations_user ON registrations(user_id);
CREATE INDEX idx_registrations_team ON registrations(team_id);
CREATE INDEX idx_registrations_status ON registrations(status);

-- ============================================================================
-- TABLE: submissions
-- ============================================================================

CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,

  -- Submitter
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL REFERENCES users(id),

  -- Submission details
  phase TEXT NOT NULL CHECK (phase IN ('public', 'private')),
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size_bytes INTEGER NOT NULL,

  -- Scoring
  score NUMERIC(10, 6),
  is_best_score BOOLEAN DEFAULT FALSE,

  -- Validation
  validation_status TEXT NOT NULL DEFAULT 'pending' CHECK (validation_status IN ('pending', 'valid', 'invalid')),
  validation_errors JSONB,

  -- Timestamps
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,

  CONSTRAINT check_user_or_team_submission CHECK (
    (user_id IS NOT NULL AND team_id IS NULL) OR
    (user_id IS NULL AND team_id IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX idx_submissions_competition ON submissions(competition_id);
CREATE INDEX idx_submissions_user ON submissions(user_id);
CREATE INDEX idx_submissions_team ON submissions(team_id);
CREATE INDEX idx_submissions_phase ON submissions(phase);
CREATE INDEX idx_submissions_best_score ON submissions(is_best_score) WHERE is_best_score = TRUE;
CREATE INDEX idx_submissions_submitted_at ON submissions(submitted_at DESC);
CREATE INDEX idx_leaderboard ON submissions(competition_id, phase, is_best_score) WHERE is_best_score = TRUE;

-- Function to update best score
CREATE OR REPLACE FUNCTION update_best_score()
RETURNS TRIGGER AS $$
BEGIN
  -- Reset all previous best scores for this participant
  IF NEW.user_id IS NOT NULL THEN
    UPDATE submissions
    SET is_best_score = FALSE
    WHERE competition_id = NEW.competition_id
      AND phase = NEW.phase
      AND user_id = NEW.user_id
      AND id != NEW.id;

    -- Set best score
    UPDATE submissions
    SET is_best_score = TRUE
    WHERE id = (
      SELECT id FROM submissions
      WHERE competition_id = NEW.competition_id
        AND phase = NEW.phase
        AND user_id = NEW.user_id
        AND validation_status = 'valid'
      ORDER BY score DESC, submitted_at ASC
      LIMIT 1
    );
  ELSE
    UPDATE submissions
    SET is_best_score = FALSE
    WHERE competition_id = NEW.competition_id
      AND phase = NEW.phase
      AND team_id = NEW.team_id
      AND id != NEW.id;

    -- Set best score
    UPDATE submissions
    SET is_best_score = TRUE
    WHERE id = (
      SELECT id FROM submissions
      WHERE competition_id = NEW.competition_id
        AND phase = NEW.phase
        AND team_id = NEW.team_id
        AND validation_status = 'valid'
      ORDER BY score DESC, submitted_at ASC
      LIMIT 1
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for best score
CREATE TRIGGER trigger_update_best_score
  AFTER INSERT OR UPDATE OF score ON submissions
  FOR EACH ROW
  WHEN (NEW.validation_status = 'valid')
  EXECUTE FUNCTION update_best_score();

-- Function to check submission quota
CREATE OR REPLACE FUNCTION check_submission_quota()
RETURNS TRIGGER AS $$
DECLARE
  comp competitions%ROWTYPE;
  daily_count INTEGER;
  total_count INTEGER;
BEGIN
  -- Get competition limits
  SELECT * INTO comp FROM competitions WHERE id = NEW.competition_id;

  -- Count submissions
  IF NEW.user_id IS NOT NULL THEN
    SELECT COUNT(*) INTO daily_count
    FROM submissions
    WHERE user_id = NEW.user_id
      AND competition_id = NEW.competition_id
      AND validation_status = 'valid'
      AND submitted_at >= CURRENT_DATE;

    SELECT COUNT(*) INTO total_count
    FROM submissions
    WHERE user_id = NEW.user_id
      AND competition_id = NEW.competition_id
      AND validation_status = 'valid';
  ELSE
    SELECT COUNT(*) INTO daily_count
    FROM submissions
    WHERE team_id = NEW.team_id
      AND competition_id = NEW.competition_id
      AND validation_status = 'valid'
      AND submitted_at >= CURRENT_DATE;

    SELECT COUNT(*) INTO total_count
    FROM submissions
    WHERE team_id = NEW.team_id
      AND competition_id = NEW.competition_id
      AND validation_status = 'valid';
  END IF;

  -- Check limits (only for valid submissions)
  IF NEW.validation_status = 'valid' THEN
    IF daily_count >= comp.daily_submission_limit THEN
      RAISE EXCEPTION 'Daily submission limit (%) exceeded', comp.daily_submission_limit;
    END IF;

    IF total_count >= comp.total_submission_limit THEN
      RAISE EXCEPTION 'Total submission limit (%) exceeded', comp.total_submission_limit;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for quota check
CREATE TRIGGER trigger_check_quota
  BEFORE UPDATE OF validation_status ON submissions
  FOR EACH ROW
  WHEN (NEW.validation_status = 'valid' AND OLD.validation_status = 'pending')
  EXECUTE FUNCTION check_submission_quota();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: users
-- ============================================================================

CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND
  role = (SELECT role FROM users WHERE id = auth.uid())
);

CREATE POLICY "Admins can view all users"
ON users FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

CREATE POLICY "Admins can update any user"
ON users FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- ============================================================================
-- RLS POLICIES: competitions
-- ============================================================================

CREATE POLICY "Anyone can view competitions"
ON competitions FOR SELECT
USING (deleted_at IS NULL);

CREATE POLICY "Admins can create competitions"
ON competitions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

CREATE POLICY "Admins can update competitions"
ON competitions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

CREATE POLICY "Admins can delete competitions"
ON competitions FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- ============================================================================
-- RLS POLICIES: teams
-- ============================================================================

CREATE POLICY "Anyone can view teams"
ON teams FOR SELECT
USING (true);

CREATE POLICY "Users can create teams"
ON teams FOR INSERT
WITH CHECK (auth.uid() = leader_id);

CREATE POLICY "Team leaders can update teams"
ON teams FOR UPDATE
USING (auth.uid() = leader_id);

CREATE POLICY "Team leaders can delete teams"
ON teams FOR DELETE
USING (auth.uid() = leader_id);

-- ============================================================================
-- RLS POLICIES: team_members
-- ============================================================================

CREATE POLICY "Anyone can view team members"
ON team_members FOR SELECT
USING (true);

CREATE POLICY "Team leaders can add members"
ON team_members FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM teams
    WHERE teams.id = team_id AND teams.leader_id = auth.uid()
  )
);

CREATE POLICY "Team leaders can remove members"
ON team_members FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM teams
    WHERE teams.id = team_id AND teams.leader_id = auth.uid()
  )
);

-- ============================================================================
-- RLS POLICIES: registrations
-- ============================================================================

CREATE POLICY "Users can view own registrations"
ON registrations FOR SELECT
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM team_members
    WHERE team_members.team_id = registrations.team_id
      AND team_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create registrations"
ON registrations FOR INSERT
WITH CHECK (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM teams
    WHERE teams.id = team_id AND teams.leader_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all registrations"
ON registrations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

CREATE POLICY "Admins can update registrations"
ON registrations FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- ============================================================================
-- RLS POLICIES: submissions
-- ============================================================================

CREATE POLICY "Users can view own submissions"
ON submissions FOR SELECT
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM team_members
    WHERE team_members.team_id = submissions.team_id
      AND team_members.user_id = auth.uid()
  )
);

CREATE POLICY "Approved users can submit"
ON submissions FOR INSERT
WITH CHECK (
  submitted_by = auth.uid() AND
  (
    -- For individual submissions
    (
      user_id = auth.uid() AND
      EXISTS (
        SELECT 1 FROM registrations
        WHERE registrations.user_id = auth.uid()
          AND registrations.competition_id = competition_id
          AND registrations.status = 'approved'
      )
    )
    OR
    -- For team submissions
    (
      team_id IS NOT NULL AND
      EXISTS (
        SELECT 1 FROM team_members
        JOIN registrations ON registrations.team_id = team_members.team_id
        WHERE team_members.user_id = auth.uid()
          AND team_members.team_id = submissions.team_id
          AND registrations.competition_id = submissions.competition_id
          AND registrations.status = 'approved'
      )
    )
  )
);

CREATE POLICY "Admins can view all submissions"
ON submissions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- ============================================================================
-- RLS POLICIES: test_datasets (Admin only)
-- ============================================================================

CREATE POLICY "Admins can manage test datasets"
ON test_datasets
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- ============================================================================
-- STORAGE BUCKETS (to be created in Supabase Dashboard or via API)
-- ============================================================================

-- Run these commands in Supabase Dashboard SQL Editor or via Supabase CLI:

-- INSERT INTO storage.buckets (id, name, public)
-- VALUES
--   ('submissions', 'submissions', false),
--   ('answer-keys', 'answer-keys', false),
--   ('avatars', 'avatars', true),
--   ('competition-assets', 'competition-assets', true);

-- ============================================================================
-- SEED DATA (Optional - for development)
-- ============================================================================

-- Create admin user (run after first user signs up)
-- UPDATE users SET role = 'admin' WHERE email = 'admin@thenoders.com';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
