'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import {
  Users,
  Crown,
  Plus,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Bell,
  ArrowRight,
} from 'lucide-react';
import { acceptTeamInvitation, rejectTeamInvitation } from '../teams/invitations/actions';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface TeamsSidebarProps {
  userTeams: {
    id: string;
    name: string;
    member_count: number;
    is_leader: boolean;
  }[];
  invitations: {
    id: string;
    team_id: string;
    invited_at: string;
    teams: { id: string; name: string };
    invited_by_user: { id: string; full_name: string | null; email: string };
  }[];
}

export default function TeamsSidebar({ userTeams, invitations }: TeamsSidebarProps) {
  const router = useRouter();
  const [processingInvite, setProcessingInvite] = useState<string | null>(null);
  const [invitesExpanded, setInvitesExpanded] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleAccept = async (invitationId: string) => {
    setProcessingInvite(invitationId);
    setActionError(null);
    const result = await acceptTeamInvitation(invitationId);
    if ('error' in result && result.error) {
      setActionError(result.error);
    } else {
      router.refresh();
    }
    setProcessingInvite(null);
  };

  const handleReject = async (invitationId: string) => {
    setProcessingInvite(invitationId);
    setActionError(null);
    const result = await rejectTeamInvitation(invitationId);
    if ('error' in result && result.error) {
      setActionError(result.error);
    } else {
      router.refresh();
    }
    setProcessingInvite(null);
  };

  return (
    <div className="space-y-4">
      {/* ── Pending Invitations — only render when there are invites ── */}
      {invitations.length > 0 && (
        <Card className="overflow-hidden">
          {/* Header — clickable to collapse */}
          <button
            className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-bg-elevated/40 transition-colors"
            onClick={() => setInvitesExpanded((v) => !v)}
            aria-expanded={invitesExpanded}
          >
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Bell className="w-4 h-4 text-warning" />
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-warning" />
              </div>
              <span className="text-sm font-semibold text-text-primary">
                Team Invitations
              </span>
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-warning/20 text-warning text-xs font-bold">
                {invitations.length}
              </span>
            </div>
            {invitesExpanded ? (
              <ChevronUp className="w-4 h-4 text-text-tertiary" />
            ) : (
              <ChevronDown className="w-4 h-4 text-text-tertiary" />
            )}
          </button>

          {/* Collapsible body */}
          {invitesExpanded && (
            <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-3 border-t border-border-default">
              {actionError && (
                <p className="text-xs text-error mt-3">{actionError}</p>
              )}
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="pt-3 first:pt-3"
                >
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-text-primary truncate">
                        {invitation.teams.name}
                      </p>
                      <p className="text-xs text-text-tertiary mt-0.5">
                        From{' '}
                        <span className="text-text-secondary">
                          {invitation.invited_by_user.full_name || invitation.invited_by_user.email}
                        </span>
                        {' · '}
                        {new Date(invitation.invited_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      className="flex-1 gap-1.5"
                      onClick={() => handleAccept(invitation.id)}
                      disabled={processingInvite === invitation.id}
                    >
                      <Check className="w-3.5 h-3.5" />
                      Accept
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 gap-1.5 text-text-tertiary hover:text-error hover:bg-error/10"
                      onClick={() => handleReject(invitation.id)}
                      disabled={processingInvite === invitation.id}
                    >
                      <X className="w-3.5 h-3.5" />
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ── My Teams ── */}
      <Card className="p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold flex items-center gap-2">
            <Users className="w-4 h-4 text-accent-cyan" />
            My Teams
          </h3>
          <span className="text-xs text-text-tertiary font-mono">
            {userTeams.length} team{userTeams.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Team list */}
        {userTeams.length > 0 ? (
          <div className="space-y-1.5 mb-4">
            {userTeams.map((team) => (
              <Link key={team.id} href={`/teams/${team.id}`} className="group block">
                <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-bg-elevated/50 hover:bg-bg-elevated transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {team.is_leader && (
                        <Crown className="w-3 h-3 text-warning shrink-0" />
                      )}
                      <p className="text-sm font-semibold text-text-primary truncate group-hover:text-primary-blue transition-colors">
                        {team.name}
                      </p>
                    </div>
                    <p className="text-xs text-text-tertiary pl-0">
                      {team.member_count} member{team.member_count !== 1 ? 's' : ''}
                      {team.is_leader && <span className="ml-1.5 text-warning/70">· Leader</span>}
                    </p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-text-tertiary group-hover:text-primary-blue group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-5 mb-4">
            <Users className="w-8 h-8 mx-auto mb-2 text-text-tertiary opacity-40" />
            <p className="text-sm text-text-tertiary">You&apos;re not in any teams yet</p>
          </div>
        )}

        {/* CTAs: Create + Browse side-by-side */}
        <div className="grid grid-cols-2 gap-2">
          <Link href="/teams/create" className="block">
            <Button variant="primary" size="sm" className="w-full gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              Create
            </Button>
          </Link>
          <Link href="/teams" className="block">
            <Button variant="outline" size="sm" className="w-full gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Browse
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
