import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { StatCard } from '@/components/admin/StatCard';
import { getCompetitionPhase, type CompetitionPhase } from '@/lib/utils/competition';
import Link from 'next/link';
import DeleteCompetitionButton from './DeleteCompetitionButton';
import {
  Trophy,
  Users,
  Target,
  Calendar,
  Plus,
  Edit2,
  Eye,
} from 'lucide-react';

export default async function AdminCompetitionsPage() {
  const supabase = await createClient();

  // Auth + role already enforced by the admin layout.

  // Fetch all competitions with stats
  const { data: competitions } = (await supabase
    .from('competitions')
    .select(
      'id, title, description, participation_type, competition_type, scoring_metric, registration_start, registration_end, public_test_start, public_test_end, private_test_start, private_test_end, created_at'
    )
    .is('deleted_at', null)
    .order('created_at', { ascending: false })) as { data: any };

  // Fetch registration counts for each competition
  const { data: registrationsData } = (await supabase
    .from('registrations')
    .select('competition_id, status, team_id')) as { data: any };

  // Fetch participant counts from view (includes team members)
  const { data: participantCountsData } = (await supabase
    .from('competition_participant_counts')
    .select('competition_id, participant_count')) as { data: any };

  // Fetch submission counts for each competition
  const { data: submissionsData } = (await supabase
    .from('submissions')
    .select('competition_id')) as { data: any };

  // Build participant counts map
  const participantCountsMap: Record<string, number> = {};
  participantCountsData?.forEach((pc: any) => {
    participantCountsMap[pc.competition_id] = pc.participant_count;
  });

  // Process registration counts (for pending/approved teams count)
  const registrationCounts: Record<string, { approved: number; pending: number; total: number; participants: number }> = {};
  registrationsData?.forEach((reg: any) => {
    if (!registrationCounts[reg.competition_id]) {
      registrationCounts[reg.competition_id] = { approved: 0, pending: 0, total: 0, participants: 0 };
    }
    registrationCounts[reg.competition_id].total++;
    if (reg.status === 'approved') {
      registrationCounts[reg.competition_id].approved++;
    } else if (reg.status === 'pending') {
      registrationCounts[reg.competition_id].pending++;
    }
  });

  // Add participant counts from view
  Object.keys(registrationCounts).forEach((compId) => {
    registrationCounts[compId].participants = participantCountsMap[compId] || 0;
  });

  const submissionCounts: Record<string, number> = {};
  submissionsData?.forEach((sub: any) => {
    submissionCounts[sub.competition_id] = (submissionCounts[sub.competition_id] || 0) + 1;
  });

  // Current phase for each competition — canonical util (computed once with a shared `now`)
  const now = new Date();

  const getPhaseVariant = (phase: string) => {
    switch (phase) {
      case 'upcoming':
        return 'secondary';
      case 'registration':
        return 'registration';
      case 'public_test':
        return 'public';
      case 'private_test':
        return 'private';
      case 'ended':
        return 'ended';
      default:
        return 'outline';
    }
  };

  const competitionsWithStats = competitions?.map((comp: any) => ({
    ...comp,
    phase: getCompetitionPhase(comp, now) as CompetitionPhase,
    registrationCount: registrationCounts[comp.id] || { approved: 0, pending: 0, total: 0, participants: participantCountsMap[comp.id] || 0 },
    submissionCount: submissionCounts[comp.id] || 0,
  }));

  const activeCount = competitionsWithStats?.filter((c: any) => c.phase === 'public_test' || c.phase === 'private_test').length || 0;
  const registeringCount = competitionsWithStats?.filter((c: any) => c.phase === 'registration').length || 0;
  const totalSubmissions = Object.values(submissionCounts).reduce((a: number, b: number) => a + b, 0);

  return (
    <>
      <AdminPageHeader
        title="Competitions"
        description="View and manage all competitions on the platform"
        action={
          <Link href="/admin/competitions/create">
            <Button variant="primary">
              <Plus className="w-5 h-5 mr-2" />
              Create New
            </Button>
          </Link>
        }
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-10">
        <StatCard Icon={Trophy} value={competitions?.length || 0} label="Total" sub="Competitions" accent="text-primary-blue/15" />
        <StatCard Icon={Target} value={activeCount} label="Active" sub="Running now" accent="text-success/15" />
        <StatCard Icon={Users} value={registeringCount} label="Registering" sub="Open for entry" accent="text-warning/15" />
        <StatCard Icon={Calendar} value={totalSubmissions} label="Submissions" sub="All time" accent="text-accent-cyan/15" />
      </div>

      {/* Competitions List */}
      <Card className="hover:translate-y-0 hover:border-border-default overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-border-default bg-bg-elevated">
            <h2 className="text-base sm:text-xl font-bold">
              All Competitions
            </h2>
          </div>

          {competitionsWithStats && competitionsWithStats.length > 0 ? (
            <div className="divide-y divide-border-default">
              {competitionsWithStats.map((competition: any) => (
                <div key={competition.id} className="p-4 sm:p-6 hover:bg-bg-elevated/50 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 lg:gap-6">
                    <div className="flex-1 min-w-0">
                      {/* Title & Badges */}
                      <div className="flex items-center gap-2 mb-2.5 sm:mb-3 flex-wrap">
                        <h3 className="text-base sm:text-lg lg:text-xl font-bold break-words">{competition.title}</h3>
                        <Badge variant={getPhaseVariant(competition.phase)}>
                          {competition.phase.replace('_', ' ')}
                        </Badge>
                        <Badge variant="tech">{competition.participation_type}</Badge>
                        {competition.competition_type === '4-phase' && (
                          <Badge variant="outline">4-Phase</Badge>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-text-secondary text-sm mb-3 sm:mb-4 line-clamp-2">
                        {competition.description}
                      </p>

                      {/* Stats */}
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 sm:gap-x-6 text-xs sm:text-sm">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <Users className="w-4 h-4 text-text-tertiary shrink-0" />
                          <span className="text-text-secondary">
                            <strong className="text-text-primary">
                              {competition.registrationCount.participants}
                            </strong>{' '}
                            participants
                            {competition.participation_type === 'team' && (
                              <span className="text-text-tertiary ml-1">
                                ({competition.registrationCount.approved} teams)
                              </span>
                            )}
                          </span>
                          {competition.registrationCount.pending > 0 && (
                            <Badge variant="yellow" className="ml-1">
                              {competition.registrationCount.pending} pending
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <Target className="w-4 h-4 text-text-tertiary shrink-0" />
                          <span className="text-text-secondary">
                            <strong className="text-text-primary">
                              {competition.submissionCount}
                            </strong>{' '}
                            submissions
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <Trophy className="w-4 h-4 text-text-tertiary shrink-0" />
                          <span className="text-text-secondary">{competition.scoring_metric}</span>
                        </div>

                        <div className="hidden sm:flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-text-tertiary shrink-0" />
                          <span className="text-text-secondary">
                            Created {new Date(competition.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Timeline — wraps cleanly on mobile */}
                      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-tertiary">
                        <span>
                          Reg: {new Date(competition.registration_start).toLocaleDateString()} – {new Date(competition.registration_end).toLocaleDateString()}
                        </span>
                        <span className="hidden sm:inline text-text-disabled">|</span>
                        <span>Public ends: {new Date(competition.public_test_end).toLocaleDateString()}</span>
                        {competition.private_test_end && (
                          <>
                            <span className="hidden sm:inline text-text-disabled">|</span>
                            <span>Private ends: {new Date(competition.private_test_end).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions — full-width buttons on mobile, stacked column on desktop */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-col gap-2 shrink-0 lg:w-44">
                      <Link href={`/admin/competitions/${competition.id}/edit`} className="contents">
                        <Button variant="outline" size="sm" className="w-full">
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </Link>
                      <Link href={`/competitions/${competition.id}`} className="contents">
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </Link>
                      <div className="col-span-2 sm:col-span-1">
                        <DeleteCompetitionButton
                          competitionId={competition.id}
                          competitionTitle={competition.title}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-text-tertiary">
              <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No competitions yet</p>
              <p className="text-sm mb-6">Create your first competition to get started</p>
              <Link href="/admin/competitions/create">
                <Button variant="primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Competition
                </Button>
              </Link>
            </div>
          )}
        </Card>
    </>
  );
}
