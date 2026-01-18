-- ============================================================================
-- Fix RLS policy for admin to update competitions (including soft delete)
-- ============================================================================
-- Issue: UPDATE policy was missing WITH CHECK clause, causing RLS violations
-- when trying to update deleted_at column
-- ============================================================================

-- Drop the old policy
DROP POLICY IF EXISTS "Admins can update competitions" ON competitions;

-- Recreate with both USING and WITH CHECK
CREATE POLICY "Admins can update competitions"
ON competitions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);
