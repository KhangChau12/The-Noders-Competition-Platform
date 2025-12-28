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

  // Create team
  // @ts-ignore - Supabase types need regeneration
  const { data: team, error: teamError } = (await (supabase
    .from('teams') as any)
    .insert({
      name: name.trim(),
      description: description?.trim() || null,
      leader_id: user.id,
    })
    .select()
    .single()) as { data: any; error: any };

  if (teamError) {
    // Handle duplicate team name error
    if (teamError.code === '23505') {
      return { error: 'A team with this name already exists. Please choose a different name.' };
    }
    return { error: teamError.message };
  }

  // Add leader as team member
  // @ts-ignore - Supabase types need regeneration
  const { error: memberError } = await (supabase
    .from('team_members') as any)
    .insert({
      team_id: team.id,
      user_id: user.id,
    });

  if (memberError) {
    // Rollback: Delete the team if we failed to add the leader as a member
    await supabase.from('teams').delete().eq('id', team.id);

    return { error: 'Failed to create team: ' + memberError.message };
  }

  revalidatePath('/teams');
  revalidatePath(`/teams/${team.id}`);

  return { success: true, teamId: team.id };
}
