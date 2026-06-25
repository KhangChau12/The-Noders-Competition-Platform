import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { Users, Crown, Plus, ArrowLeft, ArrowRight } from 'lucide-react';

export default async function TeamsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // User's memberships
  const { data: memberships } = (await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', user.id)) as { data: any };

  const myTeamIds = new Set<string>((memberships ?? []).map((m: any) => m.team_id));

  // All teams
  const { data: allTeams } = (await supabase
    .from('teams')
    .select('id, name, description, leader_id, created_at')
    .order('created_at', { ascending: false })) as { data: any };

  const teamIds = (allTeams ?? []).map((t: any) => t.id);
  const memberCounts: Record<string, number> = {};

  if (teamIds.length > 0) {
    const { data: counts } = (await supabase
      .from('team_members')
      .select('team_id')
      .in('team_id', teamIds)) as { data: any };
    (counts ?? []).forEach((row: any) => {
      memberCounts[row.team_id] = (memberCounts[row.team_id] || 0) + 1;
    });
  }

  // Leader names
  const leaderIds = [...new Set<string>((allTeams ?? []).map((t: any) => t.leader_id))];
  const leaderNames: Record<string, string> = {};
  if (leaderIds.length > 0) {
    const { data: leaders } = (await supabase
      .from('users')
      .select('id, full_name, email')
      .in('id', leaderIds)) as { data: any };
    (leaders ?? []).forEach((l: any) => {
      leaderNames[l.id] = l.full_name || l.email;
    });
  }

  const myTeams = (allTeams ?? []).filter((t: any) => myTeamIds.has(t.id));
  const otherTeams = (allTeams ?? []).filter((t: any) => !myTeamIds.has(t.id));

  return (
    <div className="min-h-screen px-4 sm:px-6 py-8 sm:py-10">
      <div className="max-w-5xl mx-auto">

        {/* Back */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-text-tertiary hover:text-text-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="font-brand text-3xl sm:text-4xl gradient-text leading-tight mb-1">Teams</h1>
            <p className="text-sm text-text-secondary">
              {myTeams.length > 0
                ? `You're in ${myTeams.length} team${myTeams.length !== 1 ? 's' : ''}.`
                : 'Create a team or join one to compete together.'}
            </p>
          </div>
          <Link href="/teams/create">
            <Button variant="primary" size="sm" className="gap-2 shrink-0">
              <Plus className="w-4 h-4" />
              Create Team
            </Button>
          </Link>
        </div>

        {/* My Teams */}
        {myTeams.length > 0 && (
          <section className="mb-10">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-text-tertiary mb-3 flex items-center gap-2">
              <Users className="w-3.5 h-3.5" />
              My Teams
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {myTeams.map((team: any) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  memberCount={memberCounts[team.id] ?? 0}
                  leaderName={leaderNames[team.leader_id]}
                  isLeader={team.leader_id === user.id}
                  isMine
                />
              ))}
            </div>
          </section>
        )}

        {/* Other Teams */}
        <section>
          {myTeams.length > 0 && (
            <h2 className="text-sm font-semibold uppercase tracking-wider text-text-tertiary mb-3">
              Other Teams
            </h2>
          )}

          {otherTeams.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-3">
              {otherTeams.map((team: any) => (
                <TeamCard
                  key={team.id}
                  team={team}
                  memberCount={memberCounts[team.id] ?? 0}
                  leaderName={leaderNames[team.leader_id]}
                  isLeader={false}
                  isMine={false}
                />
              ))}
            </div>
          ) : myTeams.length === 0 ? (
            <Card className="p-10 text-center">
              <Users className="w-10 h-10 mx-auto mb-3 text-text-tertiary opacity-30" />
              <h3 className="font-bold text-text-primary mb-1">No teams yet</h3>
              <p className="text-sm text-text-secondary mb-5">
                Be the first to create a team and start competing together.
              </p>
              <Link href="/teams/create">
                <Button variant="primary" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create the first team
                </Button>
              </Link>
            </Card>
          ) : (
            <Card className="p-6 text-center">
              <p className="text-sm text-text-tertiary">No other teams to display.</p>
            </Card>
          )}
        </section>

      </div>
    </div>
  );
}

function TeamCard({
  team,
  memberCount,
  leaderName,
  isLeader,
  isMine,
}: {
  team: any;
  memberCount: number;
  leaderName?: string;
  isLeader: boolean;
  isMine: boolean;
}) {
  return (
    <Link href={`/teams/${team.id}`} className="group block">
      <Card className={`p-4 h-full hover:border-primary-blue/40 transition-all ${isMine ? 'ring-1 ring-inset ring-primary-blue/10' : ''}`}>
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-bold text-text-primary group-hover:text-primary-blue transition-colors truncate leading-snug">
            {team.name}
          </h3>
          <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
            {isLeader && (
              <Badge variant="yellow" className="flex items-center gap-1 text-xs">
                <Crown className="w-2.5 h-2.5" />
                Leader
              </Badge>
            )}
            <ArrowRight className="w-3.5 h-3.5 text-text-tertiary group-hover:text-primary-blue group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>

        {team.description ? (
          <p className="text-sm text-text-secondary mb-3 line-clamp-2 leading-relaxed">
            {team.description}
          </p>
        ) : (
          <p className="text-sm text-text-tertiary italic mb-3">No description</p>
        )}

        <div className="flex items-center gap-3 text-xs text-text-tertiary font-mono">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {memberCount} member{memberCount !== 1 ? 's' : ''}
          </span>
          {leaderName && (
            <span className="truncate">Led by <span className="text-text-secondary">{leaderName}</span></span>
          )}
        </div>
      </Card>
    </Link>
  );
}
