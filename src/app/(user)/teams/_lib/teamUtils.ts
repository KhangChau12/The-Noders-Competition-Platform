import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Verifies that the given userId is the leader of teamId.
 * Returns { error } if not found or not leader, null if OK.
 * Also returns the full team row on success for callers that need it.
 */
export async function verifyTeamLeader(
  supabase: SupabaseClient,
  teamId: string,
  userId: string,
  errorMessage = 'Only the team leader can perform this action',
): Promise<{ error: string } | null> {
  const { data: team } = (await supabase
    .from('teams')
    .select('leader_id')
    .eq('id', teamId)
    .single()) as { data: { leader_id: string } | null };

  if (!team) {
    return { error: 'Team not found' };
  }

  if (team.leader_id !== userId) {
    return { error: errorMessage };
  }

  return null;
}
