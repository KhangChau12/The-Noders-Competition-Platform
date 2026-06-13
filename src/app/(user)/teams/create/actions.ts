'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createTeam(formData: FormData) {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const name = formData.get('name') as string;
  const description = formData.get('description') as string;

  // Validate name
  if (!name || name.trim().length < 3) {
    return { error: 'Team name must be at least 3 characters' };
  }

  if (name.trim().length > 50) {
    return { error: 'Team name must not exceed 50 characters' };
  }

  // Validate description
  if (description && description.trim().length > 500) {
    return { error: 'Team description must not exceed 500 characters' };
  }

  // Pre-generate the team ID so the rollback is point-to-point if the
  // team_members insert fails. TODO: replace both inserts with a DB trigger
  // (AFTER INSERT ON teams → INSERT INTO team_members) to make this truly atomic.
  const teamId = crypto.randomUUID();

  const { error: teamError } = await (supabase as any)
    .from('teams')
    .insert({
      id: teamId,
      name: name.trim(),
      description: description?.trim() || null,
      leader_id: user.id,
    });

  if (teamError) {
    if (teamError.code === '23505') {
      return { error: 'A team with this name already exists. Please choose a different name.' };
    }
    return { error: teamError.message };
  }

  // Add leader as team member
  const { error: memberError } = await (supabase as any)
    .from('team_members')
    .insert({
      team_id: teamId,
      user_id: user.id,
    });

  if (memberError) {
    // Attempt rollback; log if it also fails so the orphan can be cleaned up manually
    const { error: rollbackError } = await supabase
      .from('teams')
      .delete()
      .eq('id', teamId);

    if (rollbackError) {
      console.error('[createTeam] Rollback failed for orphaned team', teamId, rollbackError.message);
    }

    return { error: 'Failed to create team: ' + memberError.message };
  }

  revalidatePath('/teams');
  revalidatePath(`/teams/${teamId}`);

  return { success: true, teamId };
}
