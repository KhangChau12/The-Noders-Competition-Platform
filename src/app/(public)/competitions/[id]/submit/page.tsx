import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import SubmitForm from './SubmitForm';
import DailyResetCountdown from './DailyResetCountdown';
import { SCORING_METRIC_INFO } from '@/lib/constants';
import { getVietnamTodayStart } from '@/lib/utils/timezone';
import {
  ArrowLeft,
  Calendar,
  Target,
  Trophy,
  Upload,
  FileText,
} from 'lucide-react';

interface SubmitPageProps {
  params: {
    id: string;
  };
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SubmitPage({ params }: SubmitPageProps) {
  const { id } = params;
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/competitions/${id}`);
  }

  // Fetch competition details
  const { data: competition } = (await supabase
    .from('competitions')
    .select(
      'id, title, description, problem_statement, competition_type, participation_type, registration_start, registration_end, public_test_start, public_test_end, private_test_start, private_test_end, daily_submission_limit, total_submission_limit, max_file_size_mb, min_team_size, max_team_size, scoring_metric, dataset_url, created_by, created_at, updated_at'
    )
    .eq('id', id)
    .is('deleted_at', null)
    .single()) as { data: any };

  if (!competition) {
    redirect('/competitions');
  }

  // Check registration status (individual or team)
  let registration: any = null;
  let registeredTeamId: string | null = null;

  if (competition.participation_type === 'individual') {
    // Individual registration
    const { data: individualReg } = (await supabase
      .from('registrations')
      .select('id, competition_id, user_id, team_id, status, registered_at')
      .eq('user_id', user.id)
      .eq('competition_id', id)
      .single()) as { data: any };
    registration = individualReg;
  } else {
    // Team registration - find team where user is a member and team is registered
    const { data: teamMemberships } = (await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id)) as { data: any };

    if (teamMemberships && teamMemberships.length > 0) {
      const teamIds = teamMemberships.map((m: any) => m.team_id);

      // Single query to find approved registration for any of user's teams
      const { data: teamReg } = (await supabase
        .from('registrations')
        .select('id, competition_id, user_id, team_id, status, registered_at')
        .eq('competition_id', id)
        .in('team_id', teamIds)
        .eq('status', 'approved')
        .limit(1)
        .single()) as { data: any };

      if (teamReg) {
        registration = teamReg;
        registeredTeamId = teamReg.team_id;
      }
    }
  }

  if (!registration || registration.status !== 'approved') {
    redirect(`/competitions/${id}`);
  }

  const metricInfo = SCORING_METRIC_INFO[competition.scoring_metric as keyof typeof SCORING_METRIC_INFO];
  const isHigherBetter = metricInfo?.higher_is_better !== false;

  const todayStart = getVietnamTodayStart();

  // Entity column for the current registration (individual vs team).
  const entityCol = competition.participation_type === 'individual' ? 'user_id' : 'team_id';
  const entityVal = competition.participation_type === 'individual' ? user.id : registeredTeamId;

  // The quota only needs counts (indexed, no row transfer). The table still
  // shows every submission, but with an explicit narrow column list — dropping
  // the large `validation_errors` JSON and other unused columns. All three run
  // concurrently.
  const [
    { data: allSubmissions },
    { count: totalValidCount },
    { count: dailyValidCount },
  ] = await Promise.all([
    supabase
      .from('submissions')
      .select('id, score, phase, validation_status, is_best_score, submitted_at')
      .eq('competition_id', id)
      .eq(entityCol, entityVal as string)
      .order('submitted_at', { ascending: false }),
    supabase
      .from('submissions')
      .select('id', { count: 'exact', head: true })
      .eq('competition_id', id)
      .eq(entityCol, entityVal as string)
      .in('validation_status', ['valid', 'pending']),
    supabase
      .from('submissions')
      .select('id', { count: 'exact', head: true })
      .eq('competition_id', id)
      .eq(entityCol, entityVal as string)
      .in('validation_status', ['valid', 'pending'])
      .gte('submitted_at', todayStart.toISOString()),
  ]);

  // Sort the visible rows by score based on competition metric (nulls last).
  const sortedSubmissions = [...(allSubmissions || [])].sort((a: any, b: any) => {
    if (a.score === null && b.score === null) return 0;
    if (a.score === null) return 1;
    if (b.score === null) return -1;
    return isHigherBetter ? b.score - a.score : a.score - b.score;
  });

  const submissionCount = {
    daily: dailyValidCount || 0,
    total: totalValidCount || 0,
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/competitions/${id}`}
            className="inline-flex items-center gap-2 text-text-secondary hover:text-primary-blue transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Competition
          </Link>
          <h1 className="font-brand text-3xl sm:text-4xl md:text-5xl mb-2 gradient-text leading-tight">
            Submit Solution
          </h1>
          <p className="text-text-secondary">{competition.title}</p>
        </div>

        {/* Submission Quota */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
          <Card className="p-6 border-l-4 border-primary-blue">
            <div className="flex items-center justify-between mb-2">
              <div className="text-text-tertiary text-sm">Daily Submissions</div>
              <Calendar className="w-5 h-5 text-primary-blue" />
            </div>
            <div className="text-3xl font-bold">
              {submissionCount.daily} / {competition.daily_submission_limit ?? 15}
            </div>
            <div className="text-xs text-text-tertiary mt-1">
              {Math.max(0, (competition.daily_submission_limit ?? 15) - submissionCount.daily)} remaining today
            </div>
            <DailyResetCountdown />
          </Card>

          <Card className="p-6 border-l-4 border-accent-cyan">
            <div className="flex items-center justify-between mb-2">
              <div className="text-text-tertiary text-sm">Total Submissions</div>
              <Target className="w-5 h-5 text-accent-cyan" />
            </div>
            <div className="text-3xl font-bold">{submissionCount.total}</div>
            <div className="text-xs text-text-tertiary mt-1">Total submissions made</div>
          </Card>
        </div>

        {/* Submit Form */}
        <SubmitForm
          competitionId={id}
          competition={competition}
          submissionCount={submissionCount}
          teamId={registeredTeamId}
        />

        {/* Recent Submissions */}
        <Card className="p-5 sm:p-8 mt-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-6">
            My Submissions
          </h2>

          {sortedSubmissions && sortedSubmissions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border-default">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Rank</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Score {isHigherBetter ? '↑' : '↓'}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Phase</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                    <th className="hidden sm:table-cell px-4 py-3 text-left text-sm font-semibold">
                      Submitted At
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {sortedSubmissions.map((submission: any, index: number) => (
                    <tr
                      key={submission.id}
                      className={`hover:bg-bg-elevated/50 ${submission.is_best_score ? 'bg-success/5' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <span className={`font-semibold ${index === 0 && submission.score !== null ? 'text-warning' : ''}`}>
                          {submission.score !== null ? `#${index + 1}` : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-mono font-medium ${index === 0 && submission.score !== null ? 'text-warning' : ''}`}>
                          {submission.score?.toFixed(metricInfo?.decimals || 4) || 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={submission.phase === 'public' ? 'blue' : 'purple'}
                        >
                          {submission.phase === 'public' ? 'Public' : 'Private'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {submission.is_best_score && (
                            <Badge variant="success">Best Score</Badge>
                          )}
                          <Badge
                            variant={
                              submission.validation_status === 'valid' ? 'green' :
                              submission.validation_status === 'invalid' ? 'red' : 'yellow'
                            }
                          >
                            {submission.validation_status}
                          </Badge>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell px-4 py-3 text-sm text-text-secondary">
                        {new Date(submission.submitted_at).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-text-tertiary">
              <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No submissions yet</p>
              <p className="text-sm">Upload your first solution to get started</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
