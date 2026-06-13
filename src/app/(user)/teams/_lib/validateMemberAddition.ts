import type { SupabaseClient } from '@supabase/supabase-js';
import { ACTIVE_REGISTRATION_STATUSES } from '@/lib/constants';

/**
 * Shared validation for adding or inviting a member to a team.
 *
 * Checks:
 * 1. Max team size constraint against all active competition registrations
 * 2. Cross-competition conflict (target user already in another team for same competition)
 *
 * Returns { error } if invalid, null if OK.
 */
export async function validateMemberAddition(
  supabase: SupabaseClient,
  teamId: string,
  targetUserId: string,
): Promise<{ error: string } | null> {
  const { data: activeRegistrations } = (await supabase
    .from('registrations')
    .select(`
      competition_id,
      competitions (
        max_team_size,
        title
      )
    `)
    .eq('team_id', teamId)
    .in('status', ACTIVE_REGISTRATION_STATUSES)) as { data: any };

  if (!activeRegistrations || activeRegistrations.length === 0) {
    return null;
  }

  const { count: currentMemberCount } = await supabase
    .from('team_members')
    .select('id', { count: 'exact', head: true })
    .eq('team_id', teamId);

  const newMemberCount = (currentMemberCount || 0) + 1;

  for (const reg of activeRegistrations) {
    const maxSize = reg.competitions?.max_team_size;
    if (maxSize && newMemberCount > maxSize) {
      return {
        error: `Cannot add member: Team is registered for "${reg.competitions?.title}" which has a max team size of ${maxSize}. Team will have ${newMemberCount} members after adding.`,
      };
    }
  }

  const competitionIds = activeRegistrations.map((reg: any) => reg.competition_id);

  const { data: memberConflicts } = (await supabase
    .from('team_members')
    .select(`
      team_id,
      teams!inner (
        id,
        name,
        registrations!inner (
          competition_id,
          status,
          competitions (
            title
          )
        )
      )
    `)
    .eq('user_id', targetUserId)
    .in('teams.registrations.competition_id', competitionIds)
    .in('teams.registrations.status', ACTIVE_REGISTRATION_STATUSES)
    .neq('teams.id', teamId)) as { data: any };

  if (memberConflicts && memberConflicts.length > 0) {
    const conflictingTeam = memberConflicts[0].teams.name;
    const conflictingCompetition =
      memberConflicts[0].teams.registrations[0].competitions?.title || 'a competition';
    return {
      error: `This user is already registered with team "${conflictingTeam}" for ${conflictingCompetition}. They cannot join multiple teams for the same competition.`,
    };
  }

  return null;
}
