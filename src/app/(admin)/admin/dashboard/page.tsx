import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { StatCard } from '@/components/admin/StatCard';
import RegistrationActions from './RegistrationActions';
import { getCompetitionPhase, getNextDeadline, type CompetitionPhase } from '@/lib/utils/competition';
import Link from 'next/link';
import {
  Trophy,
  Users,
  Target,
  Clock,
  TrendingUp,
  Plus,
  BookOpen,
  CheckCircle2,
  Inbox,
  ArrowRight,
} from 'lucide-react';

const PHASE_BADGE: Record<CompetitionPhase, { variant: 'registration' | 'public' | 'private' | 'ended' | 'secondary'; label: string }> = {
  upcoming: { variant: 'secondary', label: 'Upcoming' },
  registration: { variant: 'registration', label: 'Registration' },
  public_test: { variant: 'public', label: 'Public test' },
  private_test: { variant: 'private', label: 'Private test' },
  ended: { variant: 'ended', label: 'Ended' },
};

function formatDeadline(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Auth + role already enforced by the admin layout.

  const now = new Date();

  // KPI counts
  const { count: totalCompetitions } = await supabase
    .from('competitions')
    .select('id', { count: 'exact', head: true })
    .is('deleted_at', null);

  const { count: totalUsers } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true });

  const { count: totalSubmissions } = await supabase
    .from('submissions')
    .select('id', { count: 'exact', head: true });

  const { count: totalPracticeProblems } = await (supabase as any)
    .from('practice_problems')
    .select('id', { count: 'exact', head: true })
    .is('deleted_at', null);

  // Competitions for active list + active count (phase computed via canonical util)
  const { data: competitions } = (await supabase
    .from('competitions')
    .select(
      'id, title, participation_type, registration_start, registration_end, public_test_end, private_test_start, private_test_end'
    )
    .is('deleted_at', null)) as { data: any };

  const liveCompetitions = (competitions ?? [])
    .map((comp: any) => ({ ...comp, phase: getCompetitionPhase(comp, now) }))
    .filter((comp: any) => comp.phase === 'public_test' || comp.phase === 'private_test' || comp.phase === 'registration');

  const activeCount = liveCompetitions.filter(
    (c: any) => c.phase === 'public_test' || c.phase === 'private_test'
  ).length;

  // Pending registrations (needs action)
  const { data: pendingRegistrations } = (await supabase
    .from('registrations')
    .select(
      `
      id,
      registered_at,
      user:users!registrations_user_id_fkey ( id, full_name, email ),
      competition:competitions ( id, title, participation_type ),
      team:teams ( id, name )
    `
    )
    .eq('status', 'pending')
    .order('registered_at', { ascending: false })) as { data: any };

  const pendingCount = pendingRegistrations?.length ?? 0;

  // Recent submissions
  const { data: recentSubmissions } = (await supabase
    .from('submissions')
    .select(
      `
      id,
      score,
      submitted_at,
      validation_status,
      users!submissions_user_id_fkey ( id, full_name ),
      competitions!submissions_competition_id_fkey ( id, title )
    `
    )
    .order('submitted_at', { ascending: false })
    .limit(8)) as { data: any };

  return (
    <>
      <AdminPageHeader
        title="Dashboard"
        description="Overview of competitions, registrations and activity"
        action={
          <Link href="/admin/competitions/create">
            <Button variant="primary">
              <Plus className="w-5 h-5 mr-2" />
              Create Competition
            </Button>
          </Link>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-8 sm:mb-10">
        <StatCard Icon={Trophy} value={totalCompetitions ?? 0} label="Competitions" sub={`${activeCount} active`} accent="text-primary-blue/15" />
        <StatCard Icon={Users} value={totalUsers ?? 0} label="Users" sub="Registered" accent="text-accent-cyan/15" />
        <StatCard Icon={Clock} value={pendingCount} label="Pending" sub="Need review" accent="text-warning/15" highlight={pendingCount > 0} />
        <StatCard Icon={TrendingUp} value={totalSubmissions ?? 0} label="Submissions" sub="All time" accent="text-success/15" />
        <StatCard Icon={BookOpen} value={totalPracticeProblems ?? 0} label="Practice" sub="Problems" accent="text-phase-registration/15" />
      </div>

      {/* Needs action — pending registrations (top priority) */}
      <section className="mb-8 sm:mb-10">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-lg sm:text-xl font-bold">Pending Registrations</h2>
          {pendingCount > 0 && <Badge variant="yellow">{pendingCount} to review</Badge>}
        </div>

        {pendingCount > 0 ? (
          <div className="space-y-3">
            {pendingRegistrations.map((reg: any) => (
              <Card key={reg.id} variant="default" className="hover:translate-y-0 hover:border-border-default p-4 sm:p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-text-primary break-words">
                        {reg.team?.name || reg.user?.full_name || 'Unknown'}
                      </span>
                      <Badge variant="tech">{reg.competition?.participation_type || 'individual'}</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-1.5 text-sm text-text-tertiary mt-0.5">
                      <span className="truncate max-w-full">{reg.competition?.title || 'Unknown competition'}</span>
                      <span className="text-text-disabled">·</span>
                      <span className="truncate max-w-full">{reg.team ? 'Team' : reg.user?.email}</span>
                      <span className="text-text-disabled">·</span>
                      <span className="whitespace-nowrap">{formatDeadline(new Date(reg.registered_at))}</span>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <RegistrationActions registrationId={reg.id} />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="hover:translate-y-0 hover:border-border-default p-10 text-center">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-success/60" />
            <p className="text-text-secondary font-medium">All caught up</p>
            <p className="text-sm text-text-tertiary mt-0.5">No registrations waiting for review</p>
          </Card>
        )}
      </section>

      {/* Active competitions + recent submissions */}
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* Active competitions */}
        <Card className="hover:translate-y-0 hover:border-border-default p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3 mb-5">
            <h2 className="text-lg font-bold">Live Competitions</h2>
            <Link href="/admin/competitions" className="text-xs font-medium text-primary-blue hover:underline inline-flex items-center gap-1">
              Manage all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {liveCompetitions.length > 0 ? (
            <div className="divide-y divide-border-default">
              {liveCompetitions.map((comp: any) => {
                const badge = PHASE_BADGE[comp.phase as CompetitionPhase];
                const deadline = getNextDeadline(comp, comp.phase);
                return (
                  <Link
                    key={comp.id}
                    href={`/admin/competitions/${comp.id}/edit`}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm truncate group-hover:text-primary-blue transition-colors">
                        {comp.title}
                      </div>
                      {deadline && (
                        <div className="text-xs text-text-tertiary mt-0.5">
                          {badge.label} ends {formatDeadline(deadline)}
                        </div>
                      )}
                    </div>
                    <Badge variant={badge.variant} className="shrink-0">{badge.label}</Badge>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 text-text-tertiary">
              <Trophy className="w-9 h-9 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No live competitions right now</p>
            </div>
          )}
        </Card>

        {/* Recent submissions */}
        <Card className="hover:translate-y-0 hover:border-border-default p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3 mb-5">
            <h2 className="text-lg font-bold">Recent Submissions</h2>
            <span className="text-xs font-mono text-text-tertiary uppercase tracking-wide">Last 8</span>
          </div>

          {recentSubmissions && recentSubmissions.length > 0 ? (
            <div className="divide-y divide-border-default">
              {recentSubmissions.map((sub: any) => (
                <div key={sub.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{sub.users?.full_name || 'Unknown user'}</div>
                    <div className="text-xs text-text-tertiary truncate">{sub.competitions?.title || 'Unknown competition'}</div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {sub.score !== null && (
                      <span className="font-mono text-sm font-bold text-primary-blue">{sub.score?.toFixed(4)}</span>
                    )}
                    <Badge
                      variant={
                        sub.validation_status === 'valid' ? 'green' : sub.validation_status === 'invalid' ? 'red' : 'yellow'
                      }
                    >
                      {sub.validation_status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-text-tertiary">
              <Inbox className="w-9 h-9 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No submissions yet</p>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
