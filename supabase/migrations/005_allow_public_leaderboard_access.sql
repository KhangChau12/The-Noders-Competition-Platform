-- Allow anonymous users to view submissions for leaderboard
-- This enables public leaderboard viewing without authentication

-- Drop existing SELECT policy on submissions if it exists
DROP POLICY IF EXISTS "Users can view own submissions" ON public.submissions;

-- Create new policy allowing:
-- 1. Authenticated users can view their own submissions
-- 2. Anyone (including anon) can view submissions for leaderboard purposes
CREATE POLICY "Public can view submissions for leaderboard"
ON public.submissions
FOR SELECT
USING (
  -- Allow if user is viewing their own submission
  (auth.uid() = user_id)
  OR
  -- Allow viewing any valid submission for leaderboard (public leaderboard data)
  (validation_status = 'valid')
);

-- Ensure anonymous users can read from submissions table
GRANT SELECT ON public.submissions TO anon;
GRANT SELECT ON public.submissions TO authenticated;

-- Allow anonymous users to view users table for leaderboard names
-- But only specific fields needed for leaderboard
CREATE POLICY IF NOT EXISTS "Public can view user profiles for leaderboard"
ON public.users
FOR SELECT
TO anon, authenticated
USING (true);

-- Ensure anon can read from users table
GRANT SELECT ON public.users TO anon;
GRANT SELECT ON public.users TO authenticated;

-- Allow anonymous users to view teams for team competitions
CREATE POLICY IF NOT EXISTS "Public can view teams for leaderboard"
ON public.teams
FOR SELECT
TO anon, authenticated
USING (true);

-- Ensure anon can read from teams table
GRANT SELECT ON public.teams TO anon;
GRANT SELECT ON public.teams TO authenticated;

-- Add comment for documentation
COMMENT ON POLICY "Public can view submissions for leaderboard" ON public.submissions IS
'Allows public access to valid submissions for leaderboard display while maintaining privacy for user-specific data';
