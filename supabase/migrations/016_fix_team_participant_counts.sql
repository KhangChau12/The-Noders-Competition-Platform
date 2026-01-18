-- Fix participant count view to support both individual and team competitions
-- For individual competitions: count unique users (user_id)
-- For team competitions: count total team members from registered teams
-- This replaces the old view that only counted user_id

DROP VIEW IF EXISTS public.competition_participant_counts;

CREATE OR REPLACE VIEW public.competition_participant_counts AS
SELECT
  r.competition_id,
  COALESCE(
    -- For individual registrations: count unique user_id
    SUM(CASE WHEN r.user_id IS NOT NULL THEN 1 ELSE 0 END),
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
  ) as participant_count
FROM public.registrations r
WHERE r.status = 'approved'
GROUP BY r.competition_id;

-- Grant SELECT access to authenticated users and anonymous
GRANT SELECT ON public.competition_participant_counts TO authenticated;
GRANT SELECT ON public.competition_participant_counts TO anon;

-- Add comment for documentation
COMMENT ON VIEW public.competition_participant_counts IS 'Public view showing total participant counts per competition. For individual competitions: counts users. For team competitions: counts all team members from registered teams. Bypasses RLS for read-only access';
