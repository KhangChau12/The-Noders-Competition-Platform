-- ============================================================================
-- FIX: Users table RLS policies - COMPLETE REWRITE
-- ============================================================================
-- This migration fixes the infinite recursion by using a simpler approach
-- ============================================================================

-- Drop ALL existing policies on users table
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update any user" ON users;
DROP POLICY IF EXISTS "Users can insert own profile once" ON users;

-- Drop the problematic function if it exists
DROP FUNCTION IF EXISTS public.is_admin();

-- Create simple, non-recursive policies
-- Policy 1: Allow ALL authenticated users to SELECT all rows
-- This avoids recursion and allows the app to fetch user profiles
CREATE POLICY "Authenticated users can read all users"
ON users FOR SELECT
TO authenticated
USING (true);

-- Policy 2: Users can UPDATE their own profile (but cannot escalate to admin)
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id AND
  -- User can only keep their current role, not change it
  role = (SELECT role FROM users WHERE id = auth.uid() LIMIT 1)
);

-- Policy 3: Users can INSERT their own profile once (for auto-creation)
CREATE POLICY "Users can insert own profile"
ON users FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = id AND
  role = 'user' -- New users always start as 'user'
);

-- ============================================================================
-- IMPORTANT NOTES
-- ============================================================================
-- 1. We allow SELECT for all authenticated users to avoid recursion
-- 2. Application-level authorization checks role in middleware/components
-- 3. Users cannot escalate their own role through UPDATE
-- 4. Only database admins can manually UPDATE role to 'admin' via SQL
-- ============================================================================
