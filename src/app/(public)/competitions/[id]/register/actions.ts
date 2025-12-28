'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function registerForCompetition(
  competitionId: string,
  teamId?: string | null
) {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Check if competition exists
  const { data: competition, error: compError } = (await supabase
    .from('competitions')
    .select('*')
    .eq('id', competitionId)
    .is('deleted_at', null)
    .single()) as { data: any; error: any };

  if (compError || !competition) {
    return { error: 'Competition not found' };
  }

  // Validate registration type matches competition type
  const isTeamRegistration = !!teamId;
  const isTeamCompetition = competition.participation_type === 'team';

  if (isTeamCompetition && !isTeamRegistration) {
    return { error: 'This is a team competition. Please select a team to register.' };
  }

  if (!isTeamCompetition && isTeamRegistration) {
    return { error: 'This is an individual competition. Team registration is not allowed.' };
  }

  // Handle team registration
  if (isTeamRegistration && teamId) {
    // Check if user is a member of the team
    const { data: membership } = (await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .single()) as { data: any };

    if (!membership) {
      return { error: 'You are not a member of this team' };
    }

    // Get team details and member count
    const { data: team } = (await supabase
      .from('teams')
      .select(`
        id,
        name,
        leader_id
      `)
      .eq('id', teamId)
      .single()) as { data: any };

    if (!team) {
      return { error: 'Team not found' };
    }

    // Count team members
    const { count: memberCount } = await supabase
      .from('team_members')
      .select('*', { count: 'exact', head: true })
      .eq('team_id', teamId);

    // Validate team size
    if (memberCount && competition.min_team_size && memberCount < competition.min_team_size) {
      return {
        error: `Team must have at least ${competition.min_team_size} members. Current: ${memberCount}`,
      };
    }

    if (memberCount && competition.max_team_size && memberCount > competition.max_team_size) {
      return {
        error: `Team cannot exceed ${competition.max_team_size} members. Current: ${memberCount}`,
      };
    }

    // NEW CHECK 1: User already has a team (as leader or member) registered for this competition?
    const { data: userExistingTeamRegs } = (await supabase
      .from('team_members')
      .select(`
        team_id,
        teams!inner (
          id,
          name,
          registrations!inner (
            id,
            status
          )
        )
      `)
      .eq('user_id', user.id)
      .eq('teams.registrations.competition_id', competitionId)
      .in('teams.registrations.status', ['approved', 'pending'])) as { data: any };

    if (userExistingTeamRegs && userExistingTeamRegs.length > 0) {
      const existingTeamName = userExistingTeamRegs[0].teams.name;
      return {
        error: `You already have a team "${existingTeamName}" registered for this competition. Each user can only participate in one team per competition.`
      };
    }

    // Check if team is already registered
    const { data: existingTeamRegistration } = (await supabase
      .from('registrations')
      .select('*')
      .eq('team_id', teamId)
      .eq('competition_id', competitionId)
      .single()) as { data: any };

    if (existingTeamRegistration) {
      return { error: 'This team is already registered for this competition' };
    }

    // NEW CHECK 2: Any member in this team already belongs to another team registered for this competition?
    const { data: currentTeamMembers } = (await supabase
      .from('team_members')
      .select('user_id')
      .eq('team_id', teamId)) as { data: any };

    if (currentTeamMembers && currentTeamMembers.length > 0) {
      const memberIds = currentTeamMembers.map((m: any) => m.user_id);

      // Check if any member is in another team registered for this competition
      const { data: conflictingMembers } = (await supabase
        .from('team_members')
        .select(`
          user_id,
          teams!inner (
            id,
            name,
            registrations!inner (
              id,
              status
            )
          )
        `)
        .in('user_id', memberIds)
        .eq('teams.registrations.competition_id', competitionId)
        .in('teams.registrations.status', ['approved', 'pending'])
        .neq('teams.id', teamId)) as { data: any }; // Exclude current team

      if (conflictingMembers && conflictingMembers.length > 0) {
        const conflictingTeamName = conflictingMembers[0].teams.name;
        return {
          error: `Some members of your team are already registered with another team "${conflictingTeamName}" for this competition.`
        };
      }
    }

    // Only team leader can register the team
    if (team.leader_id !== user.id) {
      return { error: 'Only the team leader can register the team for competitions' };
    }

    // Create team registration
    // @ts-ignore - Supabase types need regeneration
    const { error: regError } = await supabase.from('registrations').insert({
      team_id: teamId,
      competition_id: competitionId,
      status: 'pending',
    });

    if (regError) {
      return { error: regError.message };
    }

    revalidatePath(`/competitions/${competitionId}`);
    revalidatePath('/dashboard');
    revalidatePath('/teams');

    return { success: true, message: `Team "${team.name}" registered for approval` };
  }

  // Handle individual registration
  // Check if already registered
  const { data: existingRegistration } = (await supabase
    .from('registrations')
    .select('*')
    .eq('user_id', user.id)
    .eq('competition_id', competitionId)
    .single()) as { data: any };

  if (existingRegistration) {
    return { error: 'You are already registered for this competition' };
  }

  // Create individual registration
  // @ts-ignore - Supabase types need regeneration
  const { error: regError } = await supabase.from('registrations').insert({
    user_id: user.id,
    competition_id: competitionId,
    status: 'pending',
  });

  if (regError) {
    return { error: regError.message };
  }

  revalidatePath(`/competitions/${competitionId}`);
  revalidatePath('/dashboard');

  return { success: true, message: 'Registration submitted for approval' };
}
