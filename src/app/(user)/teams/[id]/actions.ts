'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { validateMemberAddition } from '../_lib/validateMemberAddition';
import { verifyTeamLeader } from '../_lib/teamUtils';
import { ACTIVE_REGISTRATION_STATUSES } from '@/lib/constants';

/**
 * Add a member to a team by email
 */
export async function addTeamMember(teamId: string, email: string) {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Check if current user is the team leader
  const leaderError = await verifyTeamLeader(supabase, teamId, user.id, 'Only the team leader can add members');
  if (leaderError) return leaderError;

  // Find user by email
  const { data: targetUser } = (await supabase
    .from('users')
    .select('id, email')
    .eq('email', email.toLowerCase().trim())
    .single()) as { data: any };

  if (!targetUser) {
    return { error: 'User with this email not found' };
  }

  // Check if user is already a member
  const { data: existingMember } = (await supabase
    .from('team_members')
    .select('id')
    .eq('team_id', teamId)
    .eq('user_id', targetUser.id)
    .maybeSingle()) as { data: any };

  if (existingMember) {
    return { error: 'User is already a member of this team' };
  }

  const validationError = await validateMemberAddition(supabase, teamId, targetUser.id);
  if (validationError) return validationError;

  // Add member to team
  const { error: insertError } = await (supabase as any).from('team_members').insert({
    team_id: teamId,
    user_id: targetUser.id,
  });

  if (insertError) {
    return { error: insertError.message };
  }

  revalidatePath(`/teams/${teamId}`);
  return { success: true, message: `${targetUser.email} added to team` };
}

/**
 * Remove a member from a team
 */
export async function removeTeamMember(teamId: string, memberId: string) {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Check if current user is the team leader (also get leader_id to prevent removing self)
  const { data: teamData } = (await supabase
    .from('teams')
    .select('leader_id')
    .eq('id', teamId)
    .single()) as { data: { leader_id: string } | null };

  if (!teamData) {
    return { error: 'Team not found' };
  }

  if (teamData.leader_id !== user.id) {
    return { error: 'Only the team leader can remove members' };
  }

  // Cannot remove the leader
  if (memberId === teamData.leader_id) {
    return { error: 'Cannot remove the team leader' };
  }

  // Check if team has active registrations with min team size constraints
  const { data: activeRegistrations } = (await supabase
    .from('registrations')
    .select(`
      id,
      competitions (
        min_team_size
      )
    `)
    .eq('team_id', teamId)
    .in('status', ACTIVE_REGISTRATION_STATUSES)) as { data: any };

  if (activeRegistrations && activeRegistrations.length > 0) {
    // Count current members
    const { count: currentMemberCount } = await supabase
      .from('team_members')
      .select('id', { count: 'exact', head: true })
      .eq('team_id', teamId);

    const newMemberCount = (currentMemberCount || 0) - 1;

    // Check if removing this member would violate any competition's min team size
    for (const reg of activeRegistrations) {
      const minSize = reg.competitions?.min_team_size;
      if (minSize && newMemberCount < minSize) {
        return {
          error: `Cannot remove member: Team is registered for a competition with min team size of ${minSize}. Team will have ${newMemberCount} members after removal.`,
        };
      }
    }
  }

  // Remove member
  const { error: deleteError } = await supabase
    .from('team_members')
    .delete()
    .eq('team_id', teamId)
    .eq('user_id', memberId);

  if (deleteError) {
    return { error: deleteError.message };
  }

  revalidatePath(`/teams/${teamId}`);
  return { success: true, message: 'Member removed from team' };
}

/**
 * Update team information
 */
export async function updateTeam(
  teamId: string,
  data: {
    name?: string;
    description?: string;
  }
) {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Check if current user is the team leader
  const leaderError2 = await verifyTeamLeader(supabase, teamId, user.id, 'Only the team leader can update team information');
  if (leaderError2) return leaderError2;

  // Validate name if provided
  if (data.name && data.name.trim().length < 3) {
    return { error: 'Team name must be at least 3 characters' };
  }

  if (data.name && data.name.trim().length > 50) {
    return { error: 'Team name must not exceed 50 characters' };
  }

  // Validate description if provided
  if (data.description && data.description.trim().length > 500) {
    return { error: 'Team description must not exceed 500 characters' };
  }

  // Update team
  const updateData: any = {};
  if (data.name) updateData.name = data.name.trim();
  if (data.description !== undefined) updateData.description = data.description.trim() || null;

  // @ts-ignore - Supabase types need regeneration
  const { error: updateError } = (await (supabase
    .from('teams') as any)
    .update(updateData)
    .eq('id', teamId)) as { error: any };

  if (updateError) {
    // Handle duplicate team name error
    if (updateError.code === '23505') {
      return { error: 'A team with this name already exists. Please choose a different name.' };
    }
    return { error: updateError.message };
  }

  revalidatePath(`/teams/${teamId}`);
  revalidatePath('/teams');
  return { success: true, message: 'Team updated successfully' };
}

/**
 * Delete a team
 */
export async function deleteTeam(teamId: string) {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Check if current user is the team leader
  const leaderError3 = await verifyTeamLeader(supabase, teamId, user.id, 'Only the team leader can delete the team');
  if (leaderError3) return leaderError3;

  // Check if team has any registrations (approved or pending)
  const { count } = await supabase
    .from('registrations')
    .select('id', { count: 'exact', head: true })
    .eq('team_id', teamId)
    .in('status', ACTIVE_REGISTRATION_STATUSES);

  if (count && count > 0) {
    return { error: 'Cannot delete team with competition registrations. Please wait for pending registrations to be reviewed or contact admin to remove approved registrations.' };
  }

  // Delete team (CASCADE will delete team_members)
  const { error: deleteError } = await supabase
    .from('teams')
    .delete()
    .eq('id', teamId);

  if (deleteError) {
    return { error: deleteError.message };
  }

  revalidatePath('/teams');
  return { success: true, redirect: '/teams' };
}
