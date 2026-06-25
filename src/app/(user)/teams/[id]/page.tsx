import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { ArrowLeft, Users, Crown, Calendar, Mail } from 'lucide-react';
import TeamManagement from './TeamManagement';

export default async function TeamDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Team details + leader
  const { data: team } = (await supabase
    .from('teams')
    .select(`
      id, name, description, leader_id, created_at,
      leader:users!teams_leader_id_fkey (id, full_name, email)
    `)
    .eq('id', params.id)
    .single()) as { data: any };

  if (!team) redirect('/teams');

  // Members (ordered: leader first, then by join date)
  const { data: members } = (await supabase
    .from('team_members')
    .select(`
      id, user_id, joined_at,
      users (id, full_name, email)
    `)
    .eq('team_id', params.id)
    .order('joined_at', { ascending: true })) as { data: any };

  // Pending invitations (leader only — safe to always fetch, filtered in UI)
  const { data: pendingInvites } = (await supabase
    .from('team_invitations')
    .select(`id, invited_at, users (id, full_name, email)`)
    .eq('team_id', params.id)
    .eq('status', 'pending')
    .order('invited_at', { ascending: false })) as { data: any };

  const isLeader = team.leader_id === user.id;
  const isMember = members?.some((m: any) => m.user_id === user.id);

  // Sort: leader row always first
  const sortedMembers = [...(members ?? [])].sort((a: any, b: any) => {
    if (a.user_id === team.leader_id) return -1;
    if (b.user_id === team.leader_id) return 1;
    return 0;
  });

  return (
    <div className="min-h-screen px-4 sm:px-6 py-8 sm:py-10">
      <div className="max-w-3xl mx-auto">

        {/* Back */}
        <Link
          href="/teams"
          className="inline-flex items-center gap-1.5 text-sm text-text-tertiary hover:text-text-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Teams
        </Link>

        {/* ── Team Hero ── */}
        <Card className="relative overflow-hidden p-5 sm:p-7 mb-6">
          <Users
            className="absolute -top-6 -right-6 h-32 w-32 text-primary-blue/[0.07] rotate-[12deg] pointer-events-none select-none"
            aria-hidden
          />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-2.5 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">{team.name}</h1>
              {isLeader && (
                <Badge variant="yellow" className="flex items-center gap-1">
                  <Crown className="w-3 h-3" />
                  Leader
                </Badge>
              )}
              {isMember && !isLeader && (
                <Badge variant="secondary">Member</Badge>
              )}
            </div>

            <p className="text-text-secondary text-sm mb-4 leading-relaxed">
              {team.description || <span className="text-text-tertiary italic">No description</span>}
            </p>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-text-tertiary">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                {sortedMembers.length} member{sortedMembers.length !== 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-warning" />
                Led by <span className="text-text-secondary ml-1">{team.leader.full_name || team.leader.email}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Created {new Date(team.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </Card>

        {/* ── Members ── */}
        <Card className="p-5 sm:p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-base">
              Members
              <span className="ml-2 font-mono text-sm text-text-tertiary font-normal">
                {sortedMembers.length}
              </span>
            </h2>
          </div>

          <div className="space-y-1">
            {sortedMembers.map((member: any) => (
              <MemberRow
                key={member.id}
                member={member}
                isLeader={member.user_id === team.leader_id}
                isCurrentUser={member.user_id === user.id}
              />
            ))}
          </div>

          {/* Pending invitations — visible to leader only */}
          {isLeader && pendingInvites && pendingInvites.length > 0 && (
            <div className="mt-5 pt-5 border-t border-border-default">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-tertiary mb-3">
                Pending Invitations ({pendingInvites.length})
              </p>
              <div className="space-y-1">
                {pendingInvites.map((invite: any) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-warning/5 border border-warning/15"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={invite.users.full_name || invite.users.email} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {invite.users.full_name || 'No name'}
                        </p>
                        <p className="text-xs text-text-tertiary truncate flex items-center gap-1">
                          <Mail className="w-3 h-3 shrink-0" />
                          {invite.users.email}
                        </p>
                      </div>
                    </div>
                    <Badge variant="warning" className="shrink-0">Invited</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* ── Leader Management Panel ── */}
        {isLeader && (
          <TeamManagement
            team={team}
            members={members ?? []}
            pendingInvites={pendingInvites ?? []}
            isLeader={isLeader}
          />
        )}

        {/* ── Non-member CTA ── */}
        {!isMember && !isLeader && (
          <Card className="p-5 sm:p-6 text-center">
            <Users className="w-8 h-8 mx-auto mb-3 text-text-tertiary opacity-40" />
            <h3 className="font-semibold mb-1">Not a member</h3>
            <p className="text-sm text-text-secondary mb-2">
              Ask the team leader to invite you using your email:
            </p>
            <p className="text-sm font-mono text-accent-cyan">{user.email}</p>
          </Card>
        )}

      </div>
    </div>
  );
}

// ── Avatar helper ────────────────────────────────────────────────────────────
function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const initial = name?.[0]?.toUpperCase() ?? '?';
  const sizeClass = size === 'sm' ? 'w-8 h-8 text-sm' : 'w-9 h-9 text-sm';
  return (
    <div className={`${sizeClass} bg-gradient-brand rounded-full flex items-center justify-center shrink-0 font-bold text-white`}>
      {initial}
    </div>
  );
}

// ── Member row ───────────────────────────────────────────────────────────────
function MemberRow({
  member,
  isLeader,
  isCurrentUser,
}: {
  member: any;
  isLeader: boolean;
  isCurrentUser: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg hover:bg-bg-elevated/60 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <Avatar name={member.users.full_name || member.users.email} />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-text-primary truncate">
              {member.users.full_name || 'Anonymous'}
            </p>
            {isCurrentUser && (
              <span className="text-xs text-text-tertiary">(you)</span>
            )}
          </div>
          <p className="text-xs text-text-tertiary truncate flex items-center gap-1">
            <Mail className="w-3 h-3 shrink-0" />
            {member.users.email}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {isLeader ? (
          <Badge variant="yellow" className="flex items-center gap-1">
            <Crown className="w-2.5 h-2.5" />
            Leader
          </Badge>
        ) : (
          <span className="text-xs text-text-tertiary font-mono">
            Joined {new Date(member.joined_at).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
}
