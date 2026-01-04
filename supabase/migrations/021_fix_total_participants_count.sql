-- Fix total participants count view to include team members
-- For individual registrations: count unique users
-- For team registrations: count total team members from all registered teams
-- This replaces the old view that only counted user_id

DROP VIEW IF EXISTS public.total_participants_count;

CREATE OR REPLACE VIEW public.total_participants_count AS
SELECT
  COALESCE(
    -- For individual registrations: count unique user_id
    (SELECT COUNT(DISTINCT user_id)
     FROM public.registrations
     WHERE status = 'approved' AND user_id IS NOT NULL),
    0
  ) + COALESCE(
    -- For team registrations: count total team members
    SUM(
      CASE WHEN r.team_id IS NOT NULL THEN (
        SELECT COUNT(*)
        FROM public.team_members tm
        WHERE tm.team_id = r.team_id
      ) ELSE 0 END
    ),
    0
  ) as total_count
FROM public.registrations r
WHERE r.status = 'approved' AND r.team_id IS NOT NULL;

-- Grant SELECT access to all users including anonymous
GRANT SELECT ON public.total_participants_count TO authenticated;
GRANT SELECT ON public.total_participants_count TO anon;

-- Add comment for documentation
COMMENT ON VIEW public.total_participants_count IS 'Public view showing total participant count across all competitions. For individual competitions: counts unique users. For team competitions: counts all team members from registered teams. Bypasses RLS for read-only access';
