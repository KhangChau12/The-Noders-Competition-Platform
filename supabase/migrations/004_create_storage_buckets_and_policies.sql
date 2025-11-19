-- ============================================================================
-- Migration: Create Storage Buckets and RLS Policies
-- ============================================================================
-- Description: Creates storage buckets for answer keys and submissions,
--              and sets up Row Level Security policies for admin access
-- Created: 2025-01-19
-- ============================================================================

-- ============================================================================
-- STORAGE BUCKETS
-- ============================================================================

-- Create answer-keys bucket (private, admin-only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'answer-keys',
  'answer-keys',
  false,
  10485760, -- 10MB
  ARRAY['text/csv']
)
ON CONFLICT (id) DO NOTHING;

-- Create submissions bucket (private, user can upload their own)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'submissions',
  'submissions',
  false,
  10485760, -- 10MB
  ARRAY['text/csv']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STORAGE RLS POLICIES - answer-keys bucket
-- ============================================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admins can upload answer keys" ON storage.objects;
DROP POLICY IF EXISTS "Admins can read answer keys" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update answer keys" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete answer keys" ON storage.objects;

-- Policy: Admins can upload answer keys
CREATE POLICY "Admins can upload answer keys"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'answer-keys' AND
  auth.uid() IN (
    SELECT id FROM users WHERE role = 'admin'
  )
);

-- Policy: Admins can read answer keys
CREATE POLICY "Admins can read answer keys"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'answer-keys' AND
  auth.uid() IN (
    SELECT id FROM users WHERE role = 'admin'
  )
);

-- Policy: Admins can update answer keys
CREATE POLICY "Admins can update answer keys"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'answer-keys' AND
  auth.uid() IN (
    SELECT id FROM users WHERE role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'answer-keys' AND
  auth.uid() IN (
    SELECT id FROM users WHERE role = 'admin'
  )
);

-- Policy: Admins can delete answer keys
CREATE POLICY "Admins can delete answer keys"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'answer-keys' AND
  auth.uid() IN (
    SELECT id FROM users WHERE role = 'admin'
  )
);

-- ============================================================================
-- STORAGE RLS POLICIES - submissions bucket
-- ============================================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can upload their submissions" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their submissions" ON storage.objects;
DROP POLICY IF EXISTS "Admins can read all submissions" ON storage.objects;

-- Policy: Users can upload their own submissions
CREATE POLICY "Users can upload their submissions"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'submissions' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can read their own submissions
CREATE POLICY "Users can read their submissions"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'submissions' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Admins can read all submissions
CREATE POLICY "Admins can read all submissions"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'submissions' AND
  auth.uid() IN (
    SELECT id FROM users WHERE role = 'admin'
  )
);

-- ============================================================================
-- VERIFICATION QUERIES (for testing)
-- ============================================================================

-- Verify buckets were created
-- SELECT * FROM storage.buckets WHERE id IN ('answer-keys', 'submissions');

-- Verify policies were created
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
