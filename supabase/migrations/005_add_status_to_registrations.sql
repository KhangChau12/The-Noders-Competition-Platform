-- Add status column to registrations if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'registrations' AND column_name = 'status'
  ) THEN
    ALTER TABLE registrations
    ADD COLUMN status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

-- Add reviewed_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'registrations' AND column_name = 'reviewed_at'
  ) THEN
    ALTER TABLE registrations
    ADD COLUMN reviewed_at TIMESTAMPTZ;
  END IF;
END $$;

-- Add reviewed_by column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'registrations' AND column_name = 'reviewed_by'
  ) THEN
    ALTER TABLE registrations
    ADD COLUMN reviewed_by UUID REFERENCES users(id);
  END IF;
END $$;

-- Add updated_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'registrations' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE registrations
    ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Update existing records to have 'pending' status if status is NULL
UPDATE registrations
SET status = 'pending'
WHERE status IS NULL;
