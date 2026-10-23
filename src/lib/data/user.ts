import type { SupabaseClient } from '@supabase/supabase-js';
import { getCompetitionPhase, type CompetitionPhase } from '@/lib/utils/competition';

const one = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? v[0] ?? null : v ?? null);

export interface MyTeam {
  id: string;
  name: string;
  description: string | null;
  leaderId: string;
  isLeader: boolean;
  members: { userId: string; name: string }[];
  createdAt: string;
}

export interface MyInvitation {
  id: string;
  teamId: string;
  teamName: string;
  inviter: string;
  invitedAt: string;
  memberCount: number;
}

export interface MyRegistration {
  competitionId: string;
  title: string;
  status: 'pending' | 'approved' | 'rejected';
  phase: CompetitionPhase;
  teamId: string | null;
  teamName: string | null;
  competition: {
    registration_start: string;
    registration_end: string;
    public_test_start: string;
    public_test_end: string;
    private_test_start: string | null;
    private_test_end: string | null;
  };
}

/** Teams the user belongs to, with members (names) — newest first. */
export async function getMyTeams(supabase: SupabaseClient, userId: string): Promise<MyTeam[]> {
  const { data: memberships } = await supabase.from('team_members').select('team_id').eq('user_id', userId);
  const ids = ((memberships ?? []) as { team_id: string }[]).map((m) => m.team_id);
  if (!ids.length) return [];
  const [{ data: teams }, { data: members }] = await Promise.all([
    supabase.from('teams').select('id, name, description, leader_id, created_at').in('id', ids).order('created_at', { ascending: false }),
    supabase.from('team_members').select('team_id, user_id, joined_at, users(full_name, email)').in('team_id', ids).order('joined_at', { ascending: true }),
  ]);
  return ((teams ?? []) as any[]).map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    leaderId: t.leader_id,
    isLeader: t.leader_id === userId,
    createdAt: t.created_at,
    members: ((members ?? []) as any[])
      .filter((m) => m.team_id === t.id)
      .map((m) => ({ userId: m.user_id, name: one(m.users)?.full_name || one(m.users)?.email?.split('@')[0] || 'Member' })),
  }));
}

/** Pending invitations addressed to the user. */
export async function getMyInvitations(supabase: SupabaseClient, userId: string): Promise<MyInvitation[]> {
  const { data } = (await supabase
    .from('team_invitations')
    .select('id, team_id, invited_at, teams(name), inviter:users!team_invitations_invited_by_fkey(full_name, email)')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .order('invited_at', { ascending: false })) as { data: any[] | null };
  const list = data ?? [];
  if (!list.length) return [];
  const { data: counts } = await supabase.from('team_members').select('team_id').in('team_id', list.map((i) => i.team_id));
  const countOf = (tid: string) => ((counts ?? []) as { team_id: string }[]).filter((c) => c.team_id === tid).length;
  return list.map((i) => ({
    id: i.id,
    teamId: i.team_id,
    teamName: one(i.teams)?.name ?? 'a team',
    inviter: one(i.inviter)?.full_name || one(i.inviter)?.email?.split('@')[0] || 'Someone',
    invitedAt: i.invited_at,
    memberCount: countOf(i.team_id),
  }));
}

/** Registrations of the user or any of their teams, newest contests first. */
export async function getMyRegistrations(supabase: SupabaseClient, userId: string, teamIds: string[]): Promise<MyRegistration[]> {
  let q = supabase
    .from('registrations')
    .select(
      'competition_id, status, team_id, teams(name), competitions(title, deleted_at, registration_start, registration_end, public_test_start, public_test_end, private_test_start, private_test_end)'
    );
  q = teamIds.length ? q.or(`user_id.eq.${userId},team_id.in.(${teamIds.join(',')})`) : q.eq('user_id', userId);
  const { data } = (await q) as { data: any[] | null };
  const now = new Date();
  return (data ?? [])
    .map((r) => {
      const c = one(r.competitions);
      if (!c || c.deleted_at) return null;
      return {
        competitionId: r.competition_id,
        title: c.title,
        status: r.status,
        phase: getCompetitionPhase(c, now),
        teamId: r.team_id ?? null,
        teamName: one(r.teams)?.name ?? null,
        competition: c,
      } as MyRegistration;
    })
    .filter(Boolean)
    .sort((a, b) => (b as MyRegistration).competition.registration_start.localeCompare((a as MyRegistration).competition.registration_start)) as MyRegistration[];
}
