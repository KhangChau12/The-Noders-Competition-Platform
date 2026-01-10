-- Migration: Allow unlimited submissions
-- Change default submission limits to -1 (unlimited)
-- Update trigger to skip validation when limit = -1

-- Step 1: Change default values to -1 (unlimited)
ALTER TABLE public.competitions
  ALTER COLUMN daily_submission_limit SET DEFAULT -1,
  ALTER COLUMN total_submission_limit SET DEFAULT -1;

-- Step 2: Update existing competitions to have unlimited submissions (optional - comment out if you want to keep existing limits)
-- UPDATE public.competitions
--   SET daily_submission_limit = -1,
--       total_submission_limit = -1
--   WHERE deleted_at IS NULL;

-- Step 3: Update the validation trigger to skip when limit = -1
CREATE OR REPLACE FUNCTION public.validate_submission_limits()
RETURNS TRIGGER AS $$
DECLARE
  comp RECORD;
  daily_count INTEGER;
  total_count INTEGER;
  participant_id UUID;
BEGIN
  -- Get competition details
  SELECT * INTO comp
  FROM public.competitions
  WHERE id = NEW.competition_id;

  -- Determine participant ID (user_id or team_id)
  IF NEW.user_id IS NOT NULL THEN
    participant_id := NEW.user_id;
  ELSIF NEW.team_id IS NOT NULL THEN
    participant_id := NEW.team_id;
  ELSE
    RAISE EXCEPTION 'Submission must have either user_id or team_id';
  END IF;

  -- Check daily limit (skip if limit = -1 = unlimited)
  IF comp.daily_submission_limit > 0 THEN
    SELECT COUNT(*) INTO daily_count
    FROM public.submissions
    WHERE competition_id = NEW.competition_id
      AND (user_id = participant_id OR team_id = participant_id)
      AND submitted_at >= CURRENT_DATE
      AND validation_status = 'valid';

    IF daily_count >= comp.daily_submission_limit THEN
      RAISE EXCEPTION 'Daily submission limit (%) exceeded', comp.daily_submission_limit;
    END IF;
  END IF;

  -- Check total limit (skip if limit = -1 = unlimited)
  IF comp.total_submission_limit > 0 THEN
    SELECT COUNT(*) INTO total_count
    FROM public.submissions
    WHERE competition_id = NEW.competition_id
      AND (user_id = participant_id OR team_id = participant_id)
      AND validation_status = 'valid';

    IF total_count >= comp.total_submission_limit THEN
      RAISE EXCEPTION 'Total submission limit (%) exceeded', comp.total_submission_limit;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON COLUMN public.competitions.daily_submission_limit IS 'Daily submission limit per participant. Set to -1 for unlimited.';
COMMENT ON COLUMN public.competitions.total_submission_limit IS 'Total submission limit per participant. Set to -1 for unlimited.';
