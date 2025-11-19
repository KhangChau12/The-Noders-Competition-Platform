# Project Structure & Database Schema

**Project**: AI Competition Platform
**Organization**: The Noders PTNK
**Version**: 1.0
**Last Updated**: 17/11/2025

---

## 1. Technology Stack Summary

### 1.1 Core Technologies
- **Frontend**: Next.js 14+ (App Router), React 18+, TypeScript 5+
- **Styling**: Tailwind CSS 3+
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Deployment**: Vercel (frontend) + Supabase Cloud (backend)
- **Package Manager**: npm or pnpm

### 1.2 Key Libraries
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "typescript": "^5.0.0",
    "@supabase/supabase-js": "^2.38.0",
    "@supabase/auth-helpers-nextjs": "^0.8.0",
    "tailwindcss": "^3.3.0",
    "recharts": "^2.10.0",
    "papaparse": "^5.4.1",
    "date-fns": "^2.30.0",
    "react-hook-form": "^7.48.0",
    "zod": "^3.22.0"
  }
}
```

---

## 2. Database Schema

### 2.1 Entity Relationship Diagram

```
┌─────────────┐         ┌─────────────────┐         ┌──────────────┐
│   users     │────────<│  registrations  │>────────│ competitions │
└─────────────┘         └─────────────────┘         └──────────────┘
      │                         │                           │
      │                         │                           │
      ▼                         ▼                           ▼
┌─────────────┐         ┌─────────────────┐         ┌──────────────┐
│team_members │         │   submissions   │         │test_datasets │
└─────────────┘         └─────────────────┘         └──────────────┘
      │
      ▼
┌─────────────┐
│    teams    │
└─────────────┘
```

### 2.2 Database Tables

#### Table: `users`
Extends Supabase `auth.users` with application-specific data.

```sql
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

-- Auto-update updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Columns**:
- `id`: User ID (foreign key to `auth.users`)
- `email`: User email (synced from auth)
- `role`: User role (`user` or `admin`)
- `full_name`: Display name
- `avatar_url`: Profile picture URL
- `bio`: User bio/description
- `created_at`: Account creation timestamp
- `updated_at`: Last update timestamp

---

#### Table: `teams`
Stores team information for team-based competitions.

```sql
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
```

**Columns**:
- `id`: Team ID (UUID)
- `name`: Team name (unique)
- `description`: Team description
- `leader_id`: User ID of team leader
- `avatar_url`: Team logo/avatar
- `created_at`: Team creation timestamp
- `updated_at`: Last update timestamp

---

#### Table: `team_members`
Junction table for team membership.

```sql
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
```

**Columns**:
- `id`: Membership ID
- `team_id`: Team reference
- `user_id`: User reference
- `joined_at`: Join timestamp

**Business Rules**:
- User can only be in one team at a time (enforced at app level)
- Team leader is automatically a member

---

#### Table: `competitions`
Stores competition details and configuration.

```sql
CREATE TABLE competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  problem_statement TEXT, -- Rich text/markdown

  -- Competition type
  competition_type TEXT NOT NULL CHECK (competition_type IN ('3-phase', '4-phase')),
  participation_type TEXT NOT NULL CHECK (participation_type IN ('individual', 'team')),

  -- Timeline
  registration_start TIMESTAMPTZ NOT NULL,
  registration_end TIMESTAMPTZ NOT NULL,
  public_test_start TIMESTAMPTZ NOT NULL,
  public_test_end TIMESTAMPTZ NOT NULL,
  private_test_start TIMESTAMPTZ, -- Nullable for 3-phase competitions
  private_test_end TIMESTAMPTZ,   -- Nullable for 3-phase competitions

  -- Submission rules
  daily_submission_limit INTEGER NOT NULL DEFAULT 5,
  total_submission_limit INTEGER NOT NULL DEFAULT 50,
  max_file_size_mb INTEGER NOT NULL DEFAULT 10,

  -- Team settings (only if participation_type = 'team')
  min_team_size INTEGER DEFAULT 1,
  max_team_size INTEGER DEFAULT 3,

  -- Scoring
  scoring_metric TEXT NOT NULL DEFAULT 'f1_score',

  -- Dataset links
  dataset_url TEXT, -- Public dataset download link

  -- Metadata
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Soft delete
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_competitions_type ON competitions(competition_type);
CREATE INDEX idx_competitions_participation ON competitions(participation_type);
CREATE INDEX idx_competitions_created_by ON competitions(created_by);
CREATE INDEX idx_competitions_deleted ON competitions(deleted_at);

-- Current phase computed function
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
```

**Columns**:
- `id`: Competition ID
- `title`: Competition name
- `description`: Short description
- `problem_statement`: Full problem description (markdown)
- `competition_type`: `3-phase` or `4-phase`
- `participation_type`: `individual` or `team`
- `registration_start/end`: Registration window
- `public_test_start/end`: Public test phase
- `private_test_start/end`: Private test phase (nullable)
- `daily_submission_limit`: Max submissions per day
- `total_submission_limit`: Max total submissions
- `max_file_size_mb`: Max CSV file size
- `min/max_team_size`: Team size constraints
- `scoring_metric`: Scoring algorithm (default: `f1_score`)
- `dataset_url`: Public dataset download link
- `created_by`: Admin who created competition
- `created_at/updated_at`: Timestamps
- `deleted_at`: Soft delete timestamp

---

#### Table: `test_datasets`
Stores answer keys (private files uploaded by admin).

```sql
CREATE TABLE test_datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  phase TEXT NOT NULL CHECK (phase IN ('public', 'private')),
  file_path TEXT NOT NULL, -- Supabase Storage path
  file_name TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID NOT NULL REFERENCES users(id),

  CONSTRAINT unique_competition_phase UNIQUE(competition_id, phase)
);

-- Indexes
CREATE INDEX idx_test_datasets_competition ON test_datasets(competition_id);
```

**Columns**:
- `id`: Dataset ID
- `competition_id`: Competition reference
- `phase`: `public` or `private`
- `file_path`: Storage path (e.g., `answer_keys/comp_123_public.csv`)
- `file_name`: Original file name
- `uploaded_at`: Upload timestamp
- `uploaded_by`: Admin who uploaded

**Business Rules**:
- One answer key per phase per competition
- Files stored in Supabase Storage (not in database)

---

#### Table: `registrations`
Tracks user/team registrations for competitions.

```sql
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

  -- Ensure only one of user_id or team_id is set
  CONSTRAINT check_user_or_team CHECK (
    (user_id IS NOT NULL AND team_id IS NULL) OR
    (user_id IS NULL AND team_id IS NOT NULL)
  ),

  -- Unique registration per competition
  CONSTRAINT unique_user_competition UNIQUE(competition_id, user_id),
  CONSTRAINT unique_team_competition UNIQUE(competition_id, team_id)
);

-- Indexes
CREATE INDEX idx_registrations_competition ON registrations(competition_id);
CREATE INDEX idx_registrations_user ON registrations(user_id);
CREATE INDEX idx_registrations_team ON registrations(team_id);
CREATE INDEX idx_registrations_status ON registrations(status);
```

**Columns**:
- `id`: Registration ID
- `competition_id`: Competition reference
- `user_id`: User ID (for individual) - nullable
- `team_id`: Team ID (for team) - nullable
- `status`: `pending`, `approved`, or `rejected`
- `registered_at`: Registration timestamp
- `reviewed_at`: Approval/rejection timestamp
- `reviewed_by`: Admin who reviewed

**Business Rules**:
- Exactly one of `user_id` or `team_id` must be set
- User/team can only register once per competition
- Must be approved before submitting

---

#### Table: `submissions`
Stores all user/team submissions.

```sql
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,

  -- Submitter (individual or team)
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL REFERENCES users(id), -- Actual person who clicked submit

  -- Submission details
  phase TEXT NOT NULL CHECK (phase IN ('public', 'private')),
  file_path TEXT NOT NULL, -- Supabase Storage path
  file_name TEXT NOT NULL,
  file_size_bytes INTEGER NOT NULL,

  -- Scoring
  score NUMERIC(10, 6), -- F1 score (0-1, 6 decimal places)
  is_best_score BOOLEAN DEFAULT FALSE, -- Denormalized for quick leaderboard queries

  -- Validation
  validation_status TEXT NOT NULL DEFAULT 'pending' CHECK (validation_status IN ('pending', 'valid', 'invalid')),
  validation_errors JSONB, -- Array of error messages

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

-- Composite index for leaderboard queries
CREATE INDEX idx_leaderboard ON submissions(competition_id, phase, is_best_score) WHERE is_best_score = TRUE;
```

**Columns**:
- `id`: Submission ID
- `competition_id`: Competition reference
- `user_id`: User ID (for individual) - nullable
- `team_id`: Team ID (for team) - nullable
- `submitted_by`: User who actually clicked submit (important for team tracking)
- `phase`: `public` or `private`
- `file_path`: Storage path
- `file_name`: Original file name
- `file_size_bytes`: File size
- `score`: F1 score (nullable until processed)
- `is_best_score`: True if this is the user/team's best score (denormalized)
- `validation_status`: `pending`, `valid`, or `invalid`
- `validation_errors`: JSON array of error messages
- `submitted_at`: Submission timestamp
- `processed_at`: Scoring completion timestamp

**Business Rules**:
- Exactly one of `user_id` or `team_id` must be set
- `is_best_score` updated via trigger when new submission has higher score

---

#### Table: `leaderboard_cache` (Optional)
Pre-computed leaderboard for performance.

```sql
CREATE TABLE leaderboard_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
  phase TEXT NOT NULL CHECK (phase IN ('public', 'private')),

  -- Participant (user or team)
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,

  -- Ranking
  rank INTEGER NOT NULL,
  best_score NUMERIC(10, 6) NOT NULL,
  total_submissions INTEGER NOT NULL,
  last_submission_at TIMESTAMPTZ,

  -- Metadata
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_leaderboard_entry UNIQUE(competition_id, phase, user_id, team_id)
);

-- Indexes
CREATE INDEX idx_leaderboard_cache_comp_phase ON leaderboard_cache(competition_id, phase);
CREATE INDEX idx_leaderboard_cache_rank ON leaderboard_cache(rank);
```

**Purpose**: Avoid recalculating leaderboard on every page load.

**Update Strategy**:
- Recompute after each submission (via trigger or Edge Function)
- Manual refresh button triggers recompute

---

### 2.3 Database Functions

#### Function: `update_updated_at_column()`
Auto-update `updated_at` timestamp.

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### Function: `update_best_score()`
Mark best submission after new submission.

```sql
CREATE OR REPLACE FUNCTION update_best_score()
RETURNS TRIGGER AS $$
BEGIN
  -- Reset all previous best scores for this user/team in this competition & phase
  IF NEW.user_id IS NOT NULL THEN
    UPDATE submissions
    SET is_best_score = FALSE
    WHERE competition_id = NEW.competition_id
      AND phase = NEW.phase
      AND user_id = NEW.user_id
      AND id != NEW.id;
  ELSE
    UPDATE submissions
    SET is_best_score = FALSE
    WHERE competition_id = NEW.competition_id
      AND phase = NEW.phase
      AND team_id = NEW.team_id
      AND id != NEW.id;
  END IF;

  -- Set current submission as best if it has the highest score
  IF NEW.user_id IS NOT NULL THEN
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

-- Trigger
CREATE TRIGGER trigger_update_best_score
  AFTER INSERT OR UPDATE OF score ON submissions
  FOR EACH ROW
  WHEN (NEW.validation_status = 'valid')
  EXECUTE FUNCTION update_best_score();
```

#### Function: `check_submission_quota()`
Validate submission limits before insert.

```sql
CREATE OR REPLACE FUNCTION check_submission_quota()
RETURNS TRIGGER AS $$
DECLARE
  comp competitions%ROWTYPE;
  daily_count INTEGER;
  total_count INTEGER;
BEGIN
  -- Get competition limits
  SELECT * INTO comp FROM competitions WHERE id = NEW.competition_id;

  -- Count submissions today
  IF NEW.user_id IS NOT NULL THEN
    SELECT COUNT(*) INTO daily_count
    FROM submissions
    WHERE user_id = NEW.user_id
      AND competition_id = NEW.competition_id
      AND submitted_at >= CURRENT_DATE;

    SELECT COUNT(*) INTO total_count
    FROM submissions
    WHERE user_id = NEW.user_id
      AND competition_id = NEW.competition_id;
  ELSE
    SELECT COUNT(*) INTO daily_count
    FROM submissions
    WHERE team_id = NEW.team_id
      AND competition_id = NEW.competition_id
      AND submitted_at >= CURRENT_DATE;

    SELECT COUNT(*) INTO total_count
    FROM submissions
    WHERE team_id = NEW.team_id
      AND competition_id = NEW.competition_id;
  END IF;

  -- Check limits
  IF daily_count >= comp.daily_submission_limit THEN
    RAISE EXCEPTION 'Daily submission limit (%) exceeded', comp.daily_submission_limit;
  END IF;

  IF total_count >= comp.total_submission_limit THEN
    RAISE EXCEPTION 'Total submission limit (%) exceeded', comp.total_submission_limit;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger (only check on valid submissions)
CREATE TRIGGER trigger_check_quota
  BEFORE INSERT ON submissions
  FOR EACH ROW
  WHEN (NEW.validation_status = 'valid')
  EXECUTE FUNCTION check_submission_quota();
```

---

### 2.4 Row-Level Security (RLS) Policies

See [02-authentication-system.md](02-authentication-system.md) for complete RLS policies. Key policies:

- **users**: Users can read/update own profile; admins can read/update all
- **competitions**: Public read; admin-only write
- **registrations**: Users see own; admins see all
- **submissions**: Users see own/team; admins see all
- **teams**: Members see team; public can see basic info
- **test_datasets**: Admin-only access (answer keys are secret)

---

## 3. File Structure (Next.js)

### 3.1 Folder Organization

```
competition-platform/
├── .env.local                   # Environment variables
├── .gitignore
├── next.config.js
├── package.json
├── tsconfig.json
├── tailwind.config.js
│
├── public/                      # Static assets
│   ├── images/
│   ├── fonts/
│   └── favicon.ico
│
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── layout.tsx           # Root layout
│   │   ├── page.tsx             # Home page (public landing)
│   │   ├── globals.css          # Global styles
│   │   │
│   │   ├── (auth)/              # Auth routes (grouped)
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── signup/
│   │   │   │   └── page.tsx
│   │   │   ├── forgot-password/
│   │   │   │   └── page.tsx
│   │   │   └── reset-password/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (public)/            # Public pages
│   │   │   ├── competitions/
│   │   │   │   ├── page.tsx     # Browse competitions
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx # Competition details (read-only)
│   │   │   └── about/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (user)/              # Protected user routes
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── profile/
│   │   │   │   └── page.tsx
│   │   │   ├── teams/
│   │   │   │   ├── page.tsx     # My teams
│   │   │   │   ├── create/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx # Team details
│   │   │   └── competition/
│   │   │       └── [id]/
│   │   │           ├── page.tsx       # Competition detail (registered)
│   │   │           ├── submit/
│   │   │           │   └── page.tsx
│   │   │           ├── submissions/
│   │   │           │   └── page.tsx
│   │   │           └── leaderboard/
│   │   │               └── page.tsx
│   │   │
│   │   ├── (admin)/             # Admin-only routes
│   │   │   └── admin/
│   │   │       ├── layout.tsx   # Admin layout
│   │   │       ├── dashboard/
│   │   │       │   └── page.tsx
│   │   │       ├── competitions/
│   │   │       │   ├── page.tsx       # List all
│   │   │       │   ├── create/
│   │   │       │   │   └── page.tsx
│   │   │       │   └── [id]/
│   │   │       │       ├── page.tsx   # View/edit
│   │   │       │       ├── registrations/
│   │   │       │       │   └── page.tsx
│   │   │       │       └── analytics/
│   │   │       │           └── page.tsx
│   │   │       └── users/
│   │   │           └── page.tsx
│   │   │
│   │   └── api/                 # API routes (Server Actions preferred)
│   │       └── webhooks/
│   │           └── route.ts
│   │
│   ├── components/              # React components
│   │   ├── ui/                  # Base UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Table.tsx
│   │   │   └── Spinner.tsx
│   │   │
│   │   ├── layout/              # Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── MobileMenu.tsx
│   │   │
│   │   ├── competition/         # Competition-specific components
│   │   │   ├── CompetitionCard.tsx
│   │   │   ├── CompetitionGrid.tsx
│   │   │   ├── PhaseIndicator.tsx
│   │   │   ├── CountdownTimer.tsx
│   │   │   └── SubmissionForm.tsx
│   │   │
│   │   ├── leaderboard/
│   │   │   ├── LeaderboardTable.tsx
│   │   │   └── ScoreChart.tsx
│   │   │
│   │   └── admin/               # Admin components
│   │       ├── AnalyticsDashboard.tsx
│   │       ├── RegistrationList.tsx
│   │       └── CompetitionForm.tsx
│   │
│   ├── lib/                     # Utility libraries
│   │   ├── supabase/
│   │   │   ├── client.ts        # Client-side Supabase client
│   │   │   ├── server.ts        # Server-side Supabase client
│   │   │   └── middleware.ts    # Auth middleware
│   │   │
│   │   ├── scoring/
│   │   │   ├── f1-score.ts      # F1 score calculation
│   │   │   └── validate-csv.ts  # CSV validation
│   │   │
│   │   ├── utils/
│   │   │   ├── date.ts          # Date formatting
│   │   │   ├── format.ts        # Number/text formatting
│   │   │   └── errors.ts        # Error handling
│   │   │
│   │   └── constants.ts         # App constants
│   │
│   ├── types/                   # TypeScript types
│   │   ├── database.types.ts    # Supabase generated types
│   │   ├── competition.ts
│   │   ├── user.ts
│   │   └── submission.ts
│   │
│   ├── hooks/                   # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useCompetition.ts
│   │   ├── useLeaderboard.ts
│   │   └── useSubmissions.ts
│   │
│   ├── contexts/                # React contexts
│   │   └── AuthContext.tsx
│   │
│   └── middleware.ts            # Next.js middleware (route protection)
│
└── supabase/                    # Supabase config (if using local dev)
    ├── migrations/              # Database migrations
    │   └── 001_initial_schema.sql
    └── functions/               # Edge Functions
        ├── score-submission/
        │   └── index.ts
        └── validate-csv/
            └── index.ts
```

---

## 4. API Patterns

### 4.1 Server Actions (Preferred)
Use Next.js Server Actions for data mutations.

**Example: Submit Solution**
```typescript
// app/competition/[id]/submit/actions.ts
'use server';

import { createServerActionClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function submitSolution(formData: FormData) {
  const supabase = createServerActionClient({ cookies });

  // Get current user
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return { error: 'Unauthorized' };
  }

  const competitionId = formData.get('competitionId') as string;
  const file = formData.get('file') as File;

  // Validate file
  if (!file || !file.name.endsWith('.csv')) {
    return { error: 'Please upload a CSV file' };
  }

  // Check submission quota (Edge Function)
  const { data: quotaCheck, error: quotaError } = await supabase.functions.invoke(
    'check-submission-quota',
    { body: { competitionId, userId: session.user.id } }
  );

  if (quotaError || !quotaCheck.allowed) {
    return { error: quotaCheck?.message || 'Submission limit exceeded' };
  }

  // Upload file to storage
  const fileName = `${session.user.id}/${Date.now()}_${file.name}`;
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('submissions')
    .upload(fileName, file);

  if (uploadError) {
    return { error: 'Failed to upload file' };
  }

  // Create submission record (pending validation)
  const { data: submission, error: submissionError } = await supabase
    .from('submissions')
    .insert({
      competition_id: competitionId,
      user_id: session.user.id,
      submitted_by: session.user.id,
      file_path: uploadData.path,
      file_name: file.name,
      file_size_bytes: file.size,
      validation_status: 'pending'
    })
    .select()
    .single();

  if (submissionError) {
    return { error: 'Failed to create submission' };
  }

  // Trigger validation & scoring (Edge Function - async)
  supabase.functions.invoke('score-submission', {
    body: { submissionId: submission.id }
  });

  revalidatePath(`/competition/${competitionId}/submissions`);

  return { success: true, submissionId: submission.id };
}
```

### 4.2 Edge Functions (Supabase)
For computationally intensive tasks (CSV validation, scoring).

**Example: Score Submission**
```typescript
// supabase/functions/score-submission/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Papa from 'https://esm.sh/papaparse@5';

serve(async (req) => {
  const { submissionId } = await req.json();

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Get submission details
  const { data: submission } = await supabase
    .from('submissions')
    .select('*, competition:competitions(*)')
    .eq('id', submissionId)
    .single();

  // Download submission file
  const { data: submissionFile } = await supabase.storage
    .from('submissions')
    .download(submission.file_path);

  // Download answer key
  const { data: answerKey } = await supabase
    .from('test_datasets')
    .select('file_path')
    .eq('competition_id', submission.competition_id)
    .eq('phase', submission.phase)
    .single();

  const { data: answerFile } = await supabase.storage
    .from('answer-keys')
    .download(answerKey.file_path);

  // Parse CSVs
  const submissionCSV = Papa.parse(await submissionFile.text(), { header: true });
  const answerCSV = Papa.parse(await answerFile.text(), { header: true });

  // Validate
  const validation = validateSubmission(submissionCSV.data, answerCSV.data);

  if (!validation.valid) {
    // Update submission with errors
    await supabase
      .from('submissions')
      .update({
        validation_status: 'invalid',
        validation_errors: validation.errors,
        processed_at: new Date().toISOString()
      })
      .eq('id', submissionId);

    return new Response(JSON.stringify({ success: false, errors: validation.errors }));
  }

  // Calculate F1 score
  const score = calculateF1Score(submissionCSV.data, answerCSV.data);

  // Update submission
  await supabase
    .from('submissions')
    .update({
      validation_status: 'valid',
      score,
      processed_at: new Date().toISOString()
    })
    .eq('id', submissionId);

  return new Response(JSON.stringify({ success: true, score }));
});

function validateSubmission(submission: any[], answer: any[]) {
  const errors = [];

  // Check row count
  if (submission.length !== answer.length) {
    errors.push(`Row count mismatch: expected ${answer.length}, got ${submission.length}`);
  }

  // Check column count
  if (Object.keys(submission[0]).length !== 2) {
    errors.push('CSV must have exactly 2 columns (id, prediction)');
  }

  // Check IDs match
  const submissionIds = new Set(submission.map(row => row.id));
  const answerIds = new Set(answer.map(row => row.id));

  for (const id of answerIds) {
    if (!submissionIds.has(id)) {
      errors.push(`Missing ID: ${id}`);
    }
  }

  // Check duplicates
  if (submissionIds.size !== submission.length) {
    errors.push('Duplicate IDs found');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function calculateF1Score(submission: any[], answer: any[]): number {
  // Build lookup maps
  const answerMap = new Map(answer.map(row => [row.id, row[Object.keys(row)[1]]]));
  const submissionMap = new Map(submission.map(row => [row.id, row[Object.keys(row)[1]]]));

  // Calculate confusion matrix
  let tp = 0, fp = 0, fn = 0;

  for (const [id, trueLabel] of answerMap) {
    const predLabel = submissionMap.get(id);

    if (predLabel === trueLabel) {
      tp++;
    } else {
      fp++;
      fn++;
    }
  }

  // F1 = 2 * (precision * recall) / (precision + recall)
  const precision = tp / (tp + fp);
  const recall = tp / (tp + fn);

  if (precision + recall === 0) return 0;

  return (2 * precision * recall) / (precision + recall);
}
```

---

## 5. State Management

### 5.1 Server State
Use **Next.js Server Components** for data fetching (no client-side state management needed for most data).

```tsx
// app/competitions/page.tsx (Server Component)
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export default async function CompetitionsPage() {
  const supabase = createServerComponentClient({ cookies });

  const { data: competitions } = await supabase
    .from('competitions')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div>
      {competitions?.map(comp => (
        <CompetitionCard key={comp.id} competition={comp} />
      ))}
    </div>
  );
}
```

### 5.2 Client State (React Context)
For user authentication state (see [02-authentication-system.md](02-authentication-system.md#103-client-side-auth-context-react-context)).

### 5.3 Form State (React Hook Form)
```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10),
});

export default function CompetitionForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema)
  });

  const onSubmit = async (data) => {
    // Submit to server action
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('title')} />
      {errors.title && <p>{errors.title.message}</p>}

      <textarea {...register('description')} />
      {errors.description && <p>{errors.description.message}</p>}

      <button type="submit">Create</button>
    </form>
  );
}
```

---

## 6. File Storage (Supabase Storage)

### 6.1 Buckets
```
Buckets:
├── submissions/           # User submissions (private)
├── answer-keys/           # Admin answer keys (private, admin-only)
├── avatars/               # User/team avatars (public)
└── competition-assets/    # Competition images, docs (public)
```

### 6.2 Storage Policies (RLS)
```sql
-- submissions bucket: Users can upload own, admins can read all
CREATE POLICY "Users can upload submissions"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'submissions' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can read own submissions"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'submissions' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- answer-keys bucket: Admin-only
CREATE POLICY "Admins can manage answer keys"
ON storage.objects
TO authenticated
USING (
  bucket_id = 'answer-keys' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);
```

---

## 7. Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # Server-side only

# Site
NEXT_PUBLIC_SITE_URL=https://yoursite.com

# Optional: Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

---

## 8. Deployment

### 8.1 Vercel (Frontend)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Environment Variables**: Set in Vercel dashboard.

### 8.2 Supabase (Backend)
- **Database**: Hosted on Supabase Cloud
- **Storage**: Automatic via Supabase
- **Edge Functions**: Deploy via Supabase CLI

```bash
# Install Supabase CLI
npm i -g supabase

# Link to project
supabase link --project-ref xxxxx

# Deploy Edge Functions
supabase functions deploy score-submission
```

---

## 9. Development Workflow

### 9.1 Local Development
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run development server
npm run dev

# Open http://localhost:3000
```

### 9.2 Database Migrations
```bash
# Create migration
supabase migration new add_feature_x

# Apply migrations
supabase db push

# Generate TypeScript types from schema
supabase gen types typescript --local > src/types/database.types.ts
```

### 9.3 Testing
```bash
# Run unit tests
npm run test

# Run E2E tests (Playwright/Cypress)
npm run test:e2e

# Type checking
npm run type-check
```

---

## 10. Code Quality

### 10.1 ESLint Configuration
```json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "no-console": "warn",
    "@typescript-eslint/no-unused-vars": "error"
  }
}
```

### 10.2 Prettier Configuration
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5"
}
```

---

## Appendix A: Database Seed Data

### Create Admin User
```sql
-- After admin signs up via UI, promote to admin
UPDATE users
SET role = 'admin'
WHERE email = 'admin@thenoders.com';
```

### Sample Competition
```sql
INSERT INTO competitions (
  title,
  description,
  problem_statement,
  competition_type,
  participation_type,
  registration_start,
  registration_end,
  public_test_start,
  public_test_end,
  created_by
) VALUES (
  'Image Classification Challenge',
  'Classify images into 10 categories',
  '# Problem Statement\n\nBuild a model to classify images...',
  '3-phase',
  'individual',
  NOW(),
  NOW() + INTERVAL '7 days',
  NOW() + INTERVAL '7 days',
  NOW() + INTERVAL '14 days',
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
);
```

---

## Appendix B: TypeScript Types Example

```typescript
// src/types/competition.ts
export type CompetitionType = '3-phase' | '4-phase';
export type ParticipationType = 'individual' | 'team';
export type CompetitionPhase = 'upcoming' | 'registration' | 'public_test' | 'private_test' | 'ended';
export type RegistrationStatus = 'pending' | 'approved' | 'rejected';

export interface Competition {
  id: string;
  title: string;
  description: string;
  problem_statement: string | null;
  competition_type: CompetitionType;
  participation_type: ParticipationType;
  registration_start: string;
  registration_end: string;
  public_test_start: string;
  public_test_end: string;
  private_test_start: string | null;
  private_test_end: string | null;
  daily_submission_limit: number;
  total_submission_limit: number;
  max_file_size_mb: number;
  min_team_size: number | null;
  max_team_size: number | null;
  scoring_metric: string;
  dataset_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Submission {
  id: string;
  competition_id: string;
  user_id: string | null;
  team_id: string | null;
  submitted_by: string;
  phase: 'public' | 'private';
  file_path: string;
  file_name: string;
  file_size_bytes: number;
  score: number | null;
  is_best_score: boolean;
  validation_status: 'pending' | 'valid' | 'invalid';
  validation_errors: string[] | null;
  submitted_at: string;
  processed_at: string | null;
}
```

---

**Document Status**: ✅ Complete & Ready for Development
**Next Steps**: Begin implementation using these guidelines
