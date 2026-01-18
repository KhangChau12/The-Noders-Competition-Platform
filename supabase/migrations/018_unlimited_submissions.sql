-- Migration: Update submission limits
-- Daily: 15 submissions per day
-- Total: 10000 (effectively unlimited)

-- Step 1: Change default values
ALTER TABLE public.competitions
  ALTER COLUMN daily_submission_limit SET DEFAULT 15,
  ALTER COLUMN total_submission_limit SET DEFAULT 10000;

-- Step 2: Update existing competitions
UPDATE public.competitions
  SET daily_submission_limit = 15,
      total_submission_limit = 10000
  WHERE deleted_at IS NULL;

-- Step 3: Update the validation trigger
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

  -- Check daily limit
  SELECT COUNT(*) INTO daily_count
  FROM public.submissions
  WHERE competition_id = NEW.competition_id
    AND (user_id = participant_id OR team_id = participant_id)
    AND submitted_at >= CURRENT_DATE
    AND validation_status = 'valid';

  IF daily_count >= comp.daily_submission_limit THEN
    RAISE EXCEPTION 'Daily submission limit (%) exceeded', comp.daily_submission_limit;
  END IF;

  -- Check total limit
  SELECT COUNT(*) INTO total_count
  FROM public.submissions
  WHERE competition_id = NEW.competition_id
    AND (user_id = participant_id OR team_id = participant_id)
    AND validation_status = 'valid';

  IF total_count >= comp.total_submission_limit THEN
    RAISE EXCEPTION 'Total submission limit (%) exceeded', comp.total_submission_limit;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON COLUMN public.competitions.daily_submission_limit IS 'Daily submission limit per participant. Default: 15.';
COMMENT ON COLUMN public.competitions.total_submission_limit IS 'Total submission limit per participant. Default: 10000.';
