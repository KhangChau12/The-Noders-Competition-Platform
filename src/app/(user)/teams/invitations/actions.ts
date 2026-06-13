'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { validateMemberAddition } from '../_lib/validateMemberAddition';
import { verifyTeamLeader } from '../_lib/teamUtils';

/**
 * Invite a user to join a team by email
 */
export async function inviteUserToTeam(teamId: string, email: string) {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Check if current user is the team leader
  const leaderError = await verifyTeamLeader(supabase, teamId, user.id, 'Only the team leader can invite members');
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

  // Check if invitation already exists
  const { data: existingInvitation } = (await supabase
    .from('team_invitations')
    .select('id, status')
    .eq('team_id', teamId)
    .eq('user_id', targetUser.id)
    .maybeSingle()) as { data: any };

  if (existingInvitation) {
    if (existingInvitation.status === 'pending') {
      return { error: 'An invitation is already pending for this user' };
    }
    // Delete old rejected/accepted invitation to create new one
    await supabase
      .from('team_invitations')
      .delete()
      .eq('id', existingInvitation.id);
  }

  const validationError = await validateMemberAddition(supabase, teamId, targetUser.id);
  if (validationError) return validationError;

  // Create invitation
  const { error: insertError } = await (supabase as any).from('team_invitations').insert({
    team_id: teamId,
    user_id: targetUser.id,
    invited_by: user.id,
    status: 'pending',
  });

  if (insertError) {
    return { error: insertError.message };
  }

  revalidatePath(`/teams/${teamId}`);
  revalidatePath('/dashboard');
  return { success: true, message: `Invitation sent to ${targetUser.email}` };
}

/**
 * Accept a team invitation
 */
export async function acceptTeamInvitation(invitationId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Get invitation details
  const { data: invitation } = (await supabase
    .from('team_invitations')
    .select(`
      id,
      team_id,
      teams (
        id,
        name
      )
    `)
    .eq('id', invitationId)
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .single()) as { data: any };

  if (!invitation) {
    return { error: 'Invitation not found or already responded' };
  }

  // Check if user is already a member
  const { data: existingMember } = (await supabase
    .from('team_members')
    .select('id')
    .eq('team_id', invitation.team_id)
    .eq('user_id', user.id)
    .maybeSingle()) as { data: any };

  if (existingMember) {
    // Delete invitation and return success
    await supabase.from('team_invitations').delete().eq('id', invitationId);
    return { error: 'You are already a member of this team' };
  }

  // Add user to team
  const { error: memberError } = await (supabase as any).from('team_members').insert({
    team_id: invitation.team_id,
    user_id: user.id,
  });

  if (memberError) {
    return { error: memberError.message };
  }

  // Update invitation status
  const { error: updateError } = await (supabase as any)
    .from('team_invitations')
    .update({ status: 'accepted', responded_at: new Date().toISOString() })
    .eq('id', invitationId);

  if (updateError) {
    return { error: updateError.message };
  }

  revalidatePath('/dashboard');
  revalidatePath(`/teams/${invitation.team_id}`);
  return { success: true, message: `You joined ${invitation.teams.name}!`, teamId: invitation.team_id };
}

/**
 * Reject a team invitation
 */
export async function rejectTeamInvitation(invitationId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Update invitation status
  const { error } = await (supabase as any)
    .from('team_invitations')
    .update({ status: 'rejected', responded_at: new Date().toISOString() })
    .eq('id', invitationId)
    .eq('user_id', user.id)
    .eq('status', 'pending');

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard');
  return { success: true, message: 'Invitation declined' };
}

/**
 * Cancel a team invitation (leader only)
 */
export async function cancelTeamInvitation(invitationId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Verify user is team leader
  const { data: invitation } = (await supabase
    .from('team_invitations')
    .select('team_id, teams!inner(leader_id)')
    .eq('id', invitationId)
    .single()) as { data: any };

  if (!invitation || invitation.teams.leader_id !== user.id) {
    return { error: 'Only the team leader can cancel invitations' };
  }

  // Delete invitation
  const { error } = await supabase
    .from('team_invitations')
    .delete()
    .eq('id', invitationId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard');
  revalidatePath(`/teams/${invitation.team_id}`);
  return { success: true, message: 'Invitation cancelled' };
}
