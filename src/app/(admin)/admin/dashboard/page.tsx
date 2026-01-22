import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import RegistrationActions from './RegistrationActions';
import CompetitionRegistrationsList from './CompetitionRegistrationsList';
import {
  Trophy,
  Users,
  Target,
  Clock,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Plus,
  Settings,
  Award,
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
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null);

  // Fetch active competitions (currently in public or private test phase)
  const now = new Date().toISOString();
  const { data: competitions } = (await supabase
    .from('competitions')
    .select('*')
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
    .select('*', { count: 'exact', head: true });

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

  // Debug log
  console.log('Pending registrations:', pendingRegistrations, 'Error:', regError);

  // Fetch total submissions
  const { count: totalSubmissions } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true });

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

  if (submissionsError) {
    console.error('Error fetching recent submissions:', submissionsError);
  }
  console.log('Recent submissions:', recentSubmissions?.length || 0);

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-brand text-4xl sm:text-5xl mb-2 gradient-text">
              Admin Dashboard
            </h1>
            <p className="text-text-secondary">
              Manage competitions, users, and registrations
            </p>
          </div>
          <Link href="/admin/competitions/create">
            <Button variant="primary" size="lg">
              <Plus className="w-5 h-5 mr-2" />
              Create Competition
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="p-6 border-l-4 border-primary-blue">
            <div className="flex items-center justify-between mb-2">
              <div className="text-text-tertiary text-sm">Total Competitions</div>
              <Trophy className="w-5 h-5 text-primary-blue" />
            </div>
            <div className="text-3xl font-bold text-primary-blue">
              {totalCompetitions || 0}
            </div>
            <div className="text-xs text-text-tertiary mt-1">
              {activeCompetitions?.length || 0} active
            </div>
          </Card>

          <Card className="p-6 border-l-4 border-accent-cyan">
            <div className="flex items-center justify-between mb-2">
              <div className="text-text-tertiary text-sm">Total Users</div>
              <Users className="w-5 h-5 text-accent-cyan" />
            </div>
            <div className="text-3xl font-bold text-accent-cyan">
              {totalUsers || 0}
            </div>
            <div className="text-xs text-text-tertiary mt-1">Registered participants</div>
          </Card>

          <Card className="p-6 border-l-4 border-warning">
            <div className="flex items-center justify-between mb-2">
              <div className="text-text-tertiary text-sm">Pending Approvals</div>
              <Clock className="w-5 h-5 text-warning" />
            </div>
            <div className="text-3xl font-bold text-warning">
              {pendingRegistrations?.length || 0}
            </div>
            <div className="text-xs text-text-tertiary mt-1">Need review</div>
          </Card>

          <Card className="p-6 border-l-4 border-success">
            <div className="flex items-center justify-between mb-2">
              <div className="text-text-tertiary text-sm">Total Submissions</div>
              <Target className="w-5 h-5 text-success" />
            </div>
            <div className="text-3xl font-bold text-success">
              {totalSubmissions || 0}
            </div>
            <div className="text-xs text-text-tertiary mt-1">All time</div>
          </Card>
        </div>

        {/* Pending Registrations */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-warning" />
              Pending Registrations
            </h2>
            <Badge variant="yellow">{pendingRegistrations?.length || 0} pending</Badge>
          </div>

          <Card className="overflow-hidden">
            {pendingRegistrations && pendingRegistrations.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-bg-tertiary border-b border-border-default">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold">User</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        Competition
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Type</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        Registered At
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-default">
                    {pendingRegistrations.map((registration: any) => (
                      <tr key={registration.id} className="hover:bg-bg-tertiary/50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium">
                              {registration.team?.name || registration.user?.full_name || 'Unknown'}
                            </div>
                            <div className="text-sm text-text-tertiary">
                              {registration.team ? 'Team' : registration.user?.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium">
                            {registration.competition?.title || 'Unknown'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="tech">
                            {registration.competition?.participation_type || 'individual'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-text-secondary">
                          {new Date(registration.registered_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="px-6 py-4">
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

        {/* Recent Submissions & Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent Submissions */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-accent-cyan" />
              Recent Submissions
            </h2>

            {recentSubmissions && recentSubmissions.length > 0 ? (
              <div className="space-y-4">
                {recentSubmissions.map((submission: any) => (
                  <div
                    key={submission.id}
                    className="flex items-start justify-between p-4 bg-bg-tertiary rounded-lg border border-border-default"
                  >
                    <div className="flex-1">
                      <div className="font-medium mb-1">
                        {submission.users?.full_name || 'Unknown User'}
                      </div>
                      <div className="text-sm text-text-secondary mb-2">
                        {submission.competitions?.title || 'Unknown Competition'}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-text-tertiary">
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          Score: {submission.score?.toFixed(4) || 'Pending'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(submission.submitted_at).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <Badge
                          variant={
                            submission.validation_status === 'valid' ? 'green' :
                            submission.validation_status === 'invalid' ? 'red' : 'yellow'
                          }
                          className="text-xs"
                        >
                          {submission.validation_status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {submission.is_best_score && (
                        <Badge variant="success">Best</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-text-tertiary">
                <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No submissions yet</p>
              </div>
            )}
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Settings className="w-6 h-6 text-primary-blue" />
              Quick Actions
            </h2>

            <div className="space-y-3">
              <Link href="/admin/competitions" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Trophy className="w-4 h-4 mr-2" />
                  Manage Competitions
                </Button>
              </Link>
              <Link href="/admin/competitions/create" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Competition
                </Button>
              </Link>
              <Link href="/admin/certificates" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Award className="w-4 h-4 mr-2" />
                  Add Certificate
                </Button>
              </Link>
            </div>

            {/* Active Competitions Quick View */}
            <div className="mt-6 pt-6 border-t border-border-default">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-success" />
                Active Competitions
              </h3>
              {competitions && competitions.length > 0 ? (
                <div className="space-y-2">
                  {competitions.slice(0, 5).map((comp: any) => {
                    // Determine phase for each competition
                    const nowDate = new Date();
                    const regStart = new Date(comp.registration_start);
                    const regEnd = new Date(comp.registration_end);
                    const publicEnd = new Date(comp.public_test_end);
                    const privateEnd = comp.private_test_end ? new Date(comp.private_test_end) : null;

                    let phase = 'ended';
                    let phaseColor = 'text-text-tertiary';

                    if (nowDate < regStart) {
                      phase = 'upcoming';
                      phaseColor = 'text-text-tertiary';
                    } else if (nowDate < regEnd) {
                      phase = 'registration';
                      phaseColor = 'text-warning';
                    } else if (nowDate < publicEnd) {
                      phase = 'public test';
                      phaseColor = 'text-primary-blue';
                    } else if (privateEnd && nowDate < privateEnd) {
                      phase = 'private test';
                      phaseColor = 'text-accent-cyan';
                    } else {
                      phase = 'ended';
                      phaseColor = 'text-text-tertiary';
                    }

                    return (
                      <CompetitionRegistrationsList
                        key={comp.id}
                        competitionId={comp.id}
                        competitionTitle={comp.title}
                        phase={phase}
                        phaseColor={phaseColor}
                        endDate={privateEnd || publicEnd}
                      />
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-text-tertiary">No competitions yet</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
