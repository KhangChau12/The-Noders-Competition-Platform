import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { ArrowLeft, Users, Crown, Mail, Calendar, Settings } from 'lucide-react';

export default async function TeamDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Get team details
  const { data: team } = await supabase
    .from('teams')
    .select(`
      *,
      leader:users!teams_leader_id_fkey (
        id,
        full_name,
        email
      )
    `)
    .eq('id', params.id)
    .single();

  if (!team) {
    redirect('/teams');
  }

  // Get team members
  const { data: members } = await supabase
    .from('team_members')
    .select(`
      *,
      users (
        id,
        full_name,
        email
      )
    `)
    .eq('team_id', params.id)
    .order('joined_at', { ascending: true });

  const isLeader = team.leader_id === user.id;
  const isMember = members?.some((m: any) => m.user_id === user.id);

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Back Button */}
        <Link
          href="/teams"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Teams
        </Link>

        {/* Team Header */}
        <Card className="p-8 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-6">
              {/* Team Avatar */}
              <div className="w-24 h-24 bg-gradient-brand rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-12 h-12 text-white" />
              </div>

              {/* Team Info */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{team.name}</h1>
                  {isLeader && (
                    <Badge variant="warning" className="flex items-center gap-1">
                      <Crown className="w-3 h-3" />
                      Leader
                    </Badge>
                  )}
                </div>
                <p className="text-text-secondary mb-4">
                  {team.description || 'No description'}
                </p>
                <div className="flex items-center gap-6 text-sm text-text-tertiary">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>{members?.length || 0} members</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Created {new Date(team.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            {isLeader && (
              <Button variant="outline" className="gap-2">
                <Settings className="w-4 h-4" />
                Manage Team
              </Button>
            )}
          </div>
        </Card>

        {/* Team Leader */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Crown className="w-5 h-5 text-warning" />
            Team Leader
          </h2>
          <div className="flex items-center gap-4 p-4 bg-bg-elevated rounded-lg">
            <div className="w-12 h-12 bg-gradient-brand rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-lg">
                {team.leader.full_name?.[0]?.toUpperCase() || team.leader.email[0].toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-semibold">{team.leader.full_name || 'Anonymous'}</p>
              <p className="text-sm text-text-tertiary">{team.leader.email}</p>
            </div>
          </div>
        </Card>

        {/* Team Members */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Team Members ({members?.length || 0})
          </h2>

          {members && members.length > 0 ? (
            <div className="space-y-3">
              {members.map((member: any) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 bg-bg-elevated rounded-lg hover:bg-bg-elevated/80 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-brand rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold">
                        {member.users.full_name?.[0]?.toUpperCase() || member.users.email[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold">{member.users.full_name || 'Anonymous'}</p>
                      <div className="flex items-center gap-2 text-sm text-text-tertiary">
                        <Mail className="w-3 h-3" />
                        <span>{member.users.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-text-tertiary">
                    Joined {new Date(member.joined_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-text-tertiary py-8">No members yet</p>
          )}
        </Card>

        {/* Actions for non-members */}
        {!isMember && !isLeader && (
          <Card className="p-6 mt-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Join This Team?</h3>
            <p className="text-text-secondary mb-4">
              Contact the team leader to request an invitation
            </p>
            <Button variant="outline">Request to Join</Button>
          </Card>
        )}
      </div>
    </div>
  );
}
