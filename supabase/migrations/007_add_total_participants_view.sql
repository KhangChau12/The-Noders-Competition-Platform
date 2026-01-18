-- Create a view for total unique participants count that bypasses RLS
-- This view shows the total count of unique users who have approved registrations
CREATE OR REPLACE VIEW public.total_participants_count AS
SELECT
  COUNT(DISTINCT user_id) as total_count
FROM public.registrations
WHERE status = 'approved';

-- Grant SELECT access to all users including anonymous
GRANT SELECT ON public.total_participants_count TO authenticated;
GRANT SELECT ON public.total_participants_count TO anon;

-- Add comment for documentation
COMMENT ON VIEW public.total_participants_count IS 'Public view showing total unique participant count across all competitions, bypassing RLS for read-only access';
