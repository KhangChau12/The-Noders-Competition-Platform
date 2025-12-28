'use client';

import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { Users, Crown, Plus, Bell, Check, X } from 'lucide-react';
import { acceptTeamInvitation, rejectTeamInvitation } from '../teams/invitations/actions';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface TeamsSidebarProps {
  userTeams: any[];
  invitations: any[];
}

export default function TeamsSidebar({ userTeams, invitations }: TeamsSidebarProps) {
  const router = useRouter();
  const [processingInvite, setProcessingInvite] = useState<string | null>(null);

  const handleAcceptInvitation = async (invitationId: string) => {
    setProcessingInvite(invitationId);
    const result = await acceptTeamInvitation(invitationId);
    if (result.error) {
      alert(result.error);
    } else if (result.success) {
      router.refresh();
    }
    setProcessingInvite(null);
  };

  const handleRejectInvitation = async (invitationId: string) => {
    setProcessingInvite(invitationId);
    const result = await rejectTeamInvitation(invitationId);
    if (result.error) {
      alert(result.error);
    } else if (result.success) {
      router.refresh();
    }
    setProcessingInvite(null);
  };

  return (
    <div className="space-y-6">
      {/* My Teams Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-blue" />
            My Teams
          </h3>
          <Link href="/teams/create">
            <Button variant="primary" size="sm" className="gap-1">
              <Plus className="w-4 h-4" />
              Create
            </Button>
          </Link>
        </div>

        {userTeams.length > 0 ? (
          <div className="space-y-3">
            {userTeams.map((team) => (
              <Link key={team.id} href={`/teams/${team.id}`}>
                <div className="p-3 bg-bg-elevated rounded-lg hover:bg-bg-elevated/80 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-sm">{team.name}</p>
                        {team.is_leader && (
                          <Badge variant="yellow" className="text-xs flex items-center gap-1">
                            <Crown className="w-3 h-3" />
                            Leader
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-text-tertiary">
                        {team.member_count} member{team.member_count !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-text-tertiary">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm mb-3">You're not in any teams yet</p>
            <Link href="/teams/create">
              <Button variant="outline" size="sm">
                Create Your First Team
              </Button>
            </Link>
          </div>
        )}
      </Card>

      {/* Team Invitations Section - Always visible */}
      <Card className="p-6 border-l-4 border-warning">
        <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-warning" />
          Team Invitations
          {invitations.length > 0 && <Badge variant="yellow">{invitations.length}</Badge>}
        </h3>

        {invitations.length > 0 ? (
          <div className="space-y-3">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="p-3 bg-warning/5 rounded-lg border border-warning/20"
              >
                <div className="mb-2">
                  <p className="font-semibold text-sm mb-1">{invitation.teams.name}</p>
                  <p className="text-xs text-text-tertiary">
                    Invited by {invitation.invited_by_user.full_name || invitation.invited_by_user.email}
                  </p>
                  <p className="text-xs text-text-tertiary">
                    {new Date(invitation.invited_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1 gap-1"
                    onClick={() => handleAcceptInvitation(invitation.id)}
                    disabled={processingInvite === invitation.id}
                  >
                    <Check className="w-3 h-3" />
                    Accept
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1"
                    onClick={() => handleRejectInvitation(invitation.id)}
                    disabled={processingInvite === invitation.id}
                  >
                    <X className="w-3 h-3" />
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-text-tertiary">
            <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No pending invitations</p>
          </div>
        )}
      </Card>
    </div>
  );
}
