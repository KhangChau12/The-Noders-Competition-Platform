import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import RegistrationActions from './RegistrationActions';
import {
  Trophy,
  Users,
  Target,
  Clock,
  TrendingUp,
  AlertCircle,
  Plus,
  Award,
  BookOpen,
} from 'lucide-react';

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // Check authentication and admin role
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check admin role
  const { data: profile } = (await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()) as { data: { role: string } | null };

  if (profile?.role !== 'admin') {
    redirect('/dashboard');
  }

  // Fetch total competitions
  const { count: totalCompetitions } = await supabase
    .from('competitions')
    .select('id', { count: 'exact', head: true })
    .is('deleted_at', null);

  // Fetch active competitions (currently in public or private test phase)
  const now = new Date().toISOString();
  const { data: competitions } = (await supabase
    .from('competitions')
    .select('registration_end, public_test_end, private_test_end')
    .is('deleted_at', null)) as { data: any };

  const activeCompetitions = competitions?.filter((comp: any) => {
    const publicTestEnd = new Date(comp.public_test_end);
    const privateTestEnd = comp.private_test_end
      ? new Date(comp.private_test_end)
      : null;
    const registrationEnd = new Date(comp.registration_end);

    const nowDate = new Date(now);

    // Active if between registration_end and final phase end
    if (nowDate > registrationEnd) {
      if (privateTestEnd) {
        return nowDate < privateTestEnd;
      }
      return nowDate < publicTestEnd;
    }
    return false;
  });

  // Fetch total users
  const { count: totalUsers } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true });

  // Fetch pending registrations
  const { data: pendingRegistrations, error: regError } = (await supabase
    .from('registrations')
    .select(
      `
      *,
      user:users!registrations_user_id_fkey (
        id,
        full_name,
        email
      ),
      competition:competitions (
        id,
        title,
        participation_type
      ),
      team:teams (
        id,
        name
      )
    `
    )
    .eq('status', 'pending')
    .order('registered_at', { ascending: false })) as { data: any; error: any };


  // Fetch total submissions
  const { count: totalSubmissions } = await supabase
    .from('submissions')
    .select('id', { count: 'exact', head: true });

  // Fetch total practice problems
  const { count: totalPracticeProblems } = await (supabase as any)
    .from('practice_problems')
    .select('id', { count: 'exact', head: true })
    .is('deleted_at', null);

  // Fetch recent submissions
  const { data: recentSubmissions, error: submissionsError } = (await supabase
    .from('submissions')
    .select(
      `
      id,
      score,
      is_best_score,
      submitted_at,
      validation_status,
      user_id,
      users!submissions_user_id_fkey (
        id,
        full_name,
        email
      ),
      competitions!submissions_competition_id_fkey (
        id,
        title
      )
    `
    )
    .order('submitted_at', { ascending: false })
    .limit(10)) as { data: any; error: any };


  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-brand text-3xl sm:text-4xl md:text-5xl mb-2 gradient-text leading-tight">
              Admin Dashboard
            </h1>
            <p className="text-text-secondary">
              Manage competitions, users, and registrations
            </p>
          </div>
          <Link href="/admin/competitions/create" className="shrink-0">
            <Button variant="primary" size="lg" className="w-full sm:w-auto">
              <Plus className="w-5 h-5 mr-2" />
              Create Competition
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-10">
          {[
            { Icon: Trophy, value: totalCompetitions || 0, label: 'Competitions', sub: `${activeCompetitions?.length || 0} active`, accent: 'text-primary-blue/15' },
            { Icon: Users, value: totalUsers || 0, label: 'Users', sub: 'Registered', accent: 'text-accent-cyan/15' },
            { Icon: Clock, value: pendingRegistrations?.length || 0, label: 'Pending', sub: 'Need review', accent: 'text-warning/15' },
            { Icon: TrendingUp, value: totalSubmissions || 0, label: 'Submissions', sub: 'All time', accent: 'text-success/15' },
            { Icon: BookOpen, value: totalPracticeProblems || 0, label: 'Practice', sub: 'Problems', accent: 'text-phase-registration/15' },
          ].map(({ Icon, value, label, sub, accent }) => (
            <Card key={label} className="relative overflow-hidden p-4 sm:p-5">
              <Icon className={`absolute -bottom-3 -right-3 h-14 w-14 sm:h-16 sm:w-16 ${accent} rotate-[-8deg] pointer-events-none`} />
              <p className="relative text-2xl sm:text-3xl font-bold font-mono mb-0.5">{value}</p>
              <p className="relative text-xs font-semibold uppercase tracking-wider text-text-tertiary">{label}</p>
              <p className="relative text-[11px] text-text-tertiary mt-0.5">{sub}</p>
            </Card>
          ))}
        </div>

        {/* Pending Registrations */}
        <div className="mb-12">
          <div className="flex items-center justify-between gap-3 mb-6">
            <h2 className="text-xl sm:text-2xl font-bold">
              Pending Registrations
            </h2>
            <Badge variant="yellow">{pendingRegistrations?.length || 0} pending</Badge>
          </div>

          <Card className="overflow-hidden">
            {pendingRegistrations && pendingRegistrations.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-bg-elevated border-b border-border-default">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-sm font-semibold">User</th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-sm font-semibold">
                        Competition
                      </th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-sm font-semibold">Type</th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-sm font-semibold">
                        Registered At
                      </th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-sm font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-default">
                    {pendingRegistrations.map((registration: any) => (
                      <tr key={registration.id} className="hover:bg-bg-elevated/50">
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <div>
                            <div className="font-medium">
                              {registration.team?.name || registration.user?.full_name || 'Unknown'}
                            </div>
                            <div className="text-sm text-text-tertiary">
                              {registration.team ? 'Team' : registration.user?.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <div className="font-medium">
                            {registration.competition?.title || 'Unknown'}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <Badge variant="tech">
                            {registration.competition?.participation_type || 'individual'}
                          </Badge>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-text-secondary">
                          {new Date(registration.registered_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <RegistrationActions registrationId={registration.id} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-text-tertiary opacity-50" />
                <p className="text-text-secondary">No pending registrations</p>
                {regError && (
                  <p className="text-sm text-error mt-2">Error: {regError.message}</p>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Recent Submissions & Admin Nav */}
        <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
          {/* Recent Submissions */}
          <Card className="p-6">
            <div className="flex items-center justify-between gap-3 mb-6">
              <h2 className="text-xl font-bold">Recent Submissions</h2>
              <span className="text-xs font-mono text-text-tertiary uppercase tracking-wide">Last 10</span>
            </div>

            {recentSubmissions && recentSubmissions.length > 0 ? (
              <div className="divide-y divide-border-default">
                {recentSubmissions.map((submission: any) => (
                  <div key={submission.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {submission.users?.full_name || 'Unknown User'}
                      </div>
                      <div className="text-xs text-text-tertiary truncate">
                        {submission.competitions?.title || 'Unknown Competition'}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {submission.score !== null && (
                        <span className="font-mono text-sm font-bold text-text-primary">
                          {submission.score?.toFixed(4)}
                        </span>
                      )}
                      <Badge
                        variant={
                          submission.validation_status === 'valid' ? 'green' :
                          submission.validation_status === 'invalid' ? 'red' : 'yellow'
                        }
                      >
                        {submission.validation_status}
                      </Badge>
                      <span className="text-xs text-text-tertiary hidden sm:block">
                        {new Date(submission.submitted_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-text-tertiary">
                <Target className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No submissions yet</p>
              </div>
            )}
          </Card>

          {/* Admin Navigation */}
          <div className="space-y-4 lg:sticky lg:top-24">
            {/* Competitions */}
            <Card className="p-5">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-text-tertiary mb-3">Competitions</h3>
              <div className="space-y-1">
                <Link href="/admin/competitions" className="flex items-center justify-between p-2.5 rounded-lg hover:bg-bg-elevated transition-colors group">
                  <div className="flex items-center gap-2.5 text-sm font-medium">
                    <Trophy className="w-4 h-4 text-primary-blue" />
                    Manage All
                  </div>
                  <span className="text-xs text-text-tertiary group-hover:text-text-secondary">{totalCompetitions || 0}</span>
                </Link>
                <Link href="/admin/competitions/create" className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-bg-elevated transition-colors text-sm font-medium">
                  <Plus className="w-4 h-4 text-text-tertiary" />
                  Create New
                </Link>
              </div>
            </Card>

            {/* Practice */}
            <Card className="p-5">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-text-tertiary mb-3">Practice</h3>
              <div className="space-y-1">
                <Link href="/admin/practice" className="flex items-center justify-between p-2.5 rounded-lg hover:bg-bg-elevated transition-colors group">
                  <div className="flex items-center gap-2.5 text-sm font-medium">
                    <BookOpen className="w-4 h-4 text-primary-blue" />
                    Manage Problems
                  </div>
                  <span className="text-xs text-text-tertiary group-hover:text-text-secondary">{totalPracticeProblems || 0}</span>
                </Link>
                <Link href="/admin/practice/create" className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-bg-elevated transition-colors text-sm font-medium">
                  <Plus className="w-4 h-4 text-text-tertiary" />
                  Create Problem
                </Link>
              </div>
            </Card>

            {/* Certificates */}
            <Card className="p-5">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-text-tertiary mb-3">Certificates</h3>
              <div className="space-y-1">
                <Link href="/admin/certificates" className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-bg-elevated transition-colors text-sm font-medium">
                  <Award className="w-4 h-4 text-primary-blue" />
                  Manage Certificates
                </Link>
                <Link href="/admin/certificates/upload" className="flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-bg-elevated transition-colors text-sm font-medium">
                  <Plus className="w-4 h-4 text-text-tertiary" />
                  Upload Certificate
                </Link>
              </div>
            </Card>

            {/* Pending alert */}
            {(pendingRegistrations?.length || 0) > 0 && (
              <Card className="p-5 border-warning/30 bg-warning/5">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-warning">
                      {pendingRegistrations?.length} pending approval{(pendingRegistrations?.length || 0) > 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-text-tertiary mt-0.5">Registrations waiting for review</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
