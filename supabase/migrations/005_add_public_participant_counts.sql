-- Create a view for public participant counts that bypasses RLS
-- This view shows the count of approved participants per competition
CREATE OR REPLACE VIEW public.competition_participant_counts AS
SELECT
  competition_id,
  COUNT(DISTINCT user_id) as participant_count
FROM public.registrations
WHERE status = 'approved'
GROUP BY competition_id;

-- Grant SELECT access to authenticated users
GRANT SELECT ON public.competition_participant_counts TO authenticated;
GRANT SELECT ON public.competition_participant_counts TO anon;

-- Add comment for documentation
COMMENT ON VIEW public.competition_participant_counts IS 'Public view showing participant counts per competition, bypassing RLS for read-only access';
