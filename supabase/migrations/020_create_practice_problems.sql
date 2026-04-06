-- ============================================================================
-- PRACTICE PROBLEMS - TABLES & RLS
-- ============================================================================
-- Description: Create practice_tags, practice_problems, practice_problem_tags
--              with indexes and RLS policies
-- ============================================================================

-- ============================================================================
-- TABLE: practice_tags
-- ============================================================================

CREATE TABLE practice_tags (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL UNIQUE,
  slug       TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_practice_tags_slug ON practice_tags(slug);

-- ============================================================================
-- TABLE: practice_problems
-- ============================================================================

CREATE TABLE practice_problems (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title                  TEXT NOT NULL,
  description            TEXT NOT NULL,
  problem_statement      TEXT,
  scoring_metric         TEXT NOT NULL DEFAULT 'f1_score'
                           CHECK (scoring_metric IN ('f1_score', 'accuracy', 'precision', 'recall', 'mae', 'rmse')),
  dataset_url            TEXT,
  sample_submission_url  TEXT,
  daily_submission_limit INTEGER NOT NULL DEFAULT 15,
  total_submission_limit INTEGER NOT NULL DEFAULT 0,  -- 0 = unlimited
  max_file_size_mb       INTEGER NOT NULL DEFAULT 10,
  difficulty             TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  created_by             UUID NOT NULL REFERENCES users(id),
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW(),
  deleted_at             TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_practice_problems_deleted    ON practice_problems(deleted_at);
CREATE INDEX idx_practice_problems_metric     ON practice_problems(scoring_metric);
CREATE INDEX idx_practice_problems_difficulty ON practice_problems(difficulty);
CREATE INDEX idx_practice_problems_created_by ON practice_problems(created_by);

-- Trigger for updated_at
CREATE TRIGGER update_practice_problems_updated_at
  BEFORE UPDATE ON practice_problems
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: practice_problem_tags (junction)
-- ============================================================================

CREATE TABLE practice_problem_tags (
  problem_id UUID NOT NULL REFERENCES practice_problems(id) ON DELETE CASCADE,
  tag_id     UUID NOT NULL REFERENCES practice_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (problem_id, tag_id)
);

-- Indexes
CREATE INDEX idx_practice_problem_tags_problem ON practice_problem_tags(problem_id);
CREATE INDEX idx_practice_problem_tags_tag     ON practice_problem_tags(tag_id);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE practice_tags         ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_problems     ENABLE ROW LEVEL SECURITY;
ALTER TABLE practice_problem_tags ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: practice_tags
-- ============================================================================

CREATE POLICY "Anyone can view practice tags"
ON practice_tags FOR SELECT
USING (true);

CREATE POLICY "Admins can insert practice tags"
ON practice_tags FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

CREATE POLICY "Admins can update practice tags"
ON practice_tags FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

CREATE POLICY "Admins can delete practice tags"
ON practice_tags FOR DELETE
USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- ============================================================================
-- RLS POLICIES: practice_problems
-- ============================================================================

CREATE POLICY "Anyone can view practice problems"
ON practice_problems FOR SELECT
USING (deleted_at IS NULL);

CREATE POLICY "Admins can insert practice problems"
ON practice_problems FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

CREATE POLICY "Admins can update practice problems"
ON practice_problems FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

CREATE POLICY "Admins can delete practice problems"
ON practice_problems FOR DELETE
USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

CREATE POLICY "Admins can view soft-deleted practice problems"
ON practice_problems FOR SELECT
USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- ============================================================================
-- RLS POLICIES: practice_problem_tags
-- ============================================================================

CREATE POLICY "Anyone can view practice problem tags"
ON practice_problem_tags FOR SELECT
USING (true);

CREATE POLICY "Admins can manage practice problem tags"
ON practice_problem_tags FOR ALL
USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);

-- ============================================================================
-- END OF MIGRATION 020
-- ============================================================================
