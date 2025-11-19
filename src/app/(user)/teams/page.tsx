import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { Users, Plus, Crown, Calendar } from 'lucide-react';

export default async function TeamsPage() {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Get teams where user is a member
  const { data: teamMemberships } = (await supabase
    .from('team_members')
    .select(`
      *,
      teams (
        *,
        leader:users!teams_leader_id_fkey (
          id,
          full_name,
          email
        )
      )
    `)
    .eq('user_id', user.id)) as { data: any };

  // Get teams where user is leader
  const { data: ledTeams } = (await supabase
    .from('teams')
    .select('*')
    .eq('leader_id', user.id)) as { data: any };

  const myTeams = teamMemberships?.map((m: any) => m.teams) || [];
  const isLeader = (teamId: string) => ledTeams?.some((t: any) => t.id === teamId);

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Teams</h1>
            <p className="text-text-secondary">Manage your team memberships and create new teams</p>
          </div>
          <Link href="/teams/create">
            <Button variant="primary" className="gap-2">
              <Plus className="w-5 h-5" />
              Create Team
            </Button>
          </Link>
        </div>

        {/* Teams Grid */}
        {myTeams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myTeams.map((team: any) => (
              <Link key={team.id} href={`/teams/${team.id}`}>
                <Card className="p-6 hover:border-primary-blue transition-all h-full cursor-pointer">
                  {/* Team Avatar */}
                  <div className="w-16 h-16 bg-gradient-brand rounded-lg flex items-center justify-center mb-4">
                    <Users className="w-8 h-8 text-white" />
                  </div>

                  {/* Team Name & Leader Badge */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold truncate">{team.name}</h3>
                      {isLeader(team.id) && (
                        <Badge variant="yellow" className="flex items-center gap-1">
                          <Crown className="w-3 h-3" />
                          Leader
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-text-secondary line-clamp-2">
                      {team.description || 'No description'}
                    </p>
                  </div>

                  {/* Team Stats */}
                  <div className="flex items-center gap-4 text-sm text-text-tertiary">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>
                        {/* Count members from team_members table */}
                        Members
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(team.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-text-tertiary" />
            <h3 className="text-xl font-bold mb-2">No Teams Yet</h3>
            <p className="text-text-secondary mb-6">
              Create a team to participate in team-based competitions
            </p>
            <Link href="/teams/create">
              <Button variant="primary" size="lg">
                Create Your First Team
              </Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}
