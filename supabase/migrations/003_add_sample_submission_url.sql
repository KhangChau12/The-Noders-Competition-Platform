-- ============================================================================
-- Migration: Add sample_submission_url column to competitions table
-- ============================================================================
-- This migration adds an optional field for sample submission file URL
-- ============================================================================

ALTER TABLE competitions
ADD COLUMN IF NOT EXISTS sample_submission_url TEXT;

COMMENT ON COLUMN competitions.sample_submission_url IS 'URL to sample submission file (optional)';
