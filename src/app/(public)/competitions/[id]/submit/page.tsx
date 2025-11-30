import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import SubmitForm from './SubmitForm';
import DailyResetCountdown from './DailyResetCountdown';
import { SCORING_METRIC_INFO } from '@/lib/constants';
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
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()) as { data: any };

  if (!competition) {
    redirect('/competitions');
  }

  // Check registration status
  const { data: registration } = (await supabase
    .from('registrations')
    .select('*')
    .eq('user_id', user.id)
    .eq('competition_id', id)
    .single()) as { data: any };

  if (!registration || registration.status !== 'approved') {
    redirect(`/competitions/${id}`);
  }

  // Get user's submissions
  const { data: submissions } = (await supabase
    .from('submissions')
    .select('*')
    .eq('user_id', user.id)
    .eq('competition_id', id)
    .order('submitted_at', { ascending: false })) as { data: any };

  // Sort submissions by score based on competition metric
  const metricInfo = SCORING_METRIC_INFO[competition.scoring_metric as keyof typeof SCORING_METRIC_INFO];
  const isHigherBetter = metricInfo?.higher_is_better !== false;

  const sortedSubmissions = [...(submissions || [])].sort((a: any, b: any) => {
    // Handle null scores (put at end)
    if (a.score === null && b.score === null) return 0;
    if (a.score === null) return 1;
    if (b.score === null) return -1;

    // Sort by score based on metric direction
    if (isHigherBetter) {
      return b.score - a.score; // DESC for higher is better
    } else {
      return a.score - b.score; // ASC for lower is better
    }
  });

  // Count daily and total submissions (only VALID submissions count towards limit)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const validSubmissions = submissions?.filter(
    (sub: any) => sub.validation_status === 'valid'
  ) || [];

  const dailyValidSubmissions = validSubmissions.filter(
    (sub: any) => new Date(sub.submitted_at) >= todayStart
  );

  const submissionCount = {
    daily: dailyValidSubmissions.length,
    total: validSubmissions.length,
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
          <h1 className="font-brand text-4xl sm:text-5xl mb-2 gradient-text">
            Submit Solution
          </h1>
          <p className="text-text-secondary">{competition.title}</p>
        </div>

        {/* Submission Quota */}
        <div className="grid sm:grid-cols-2 gap-6 mb-8">
          <Card className="p-6 border-l-4 border-primary-blue">
            <div className="flex items-center justify-between mb-2">
              <div className="text-text-tertiary text-sm">Daily Submissions</div>
              <Calendar className="w-5 h-5 text-primary-blue" />
            </div>
            <div className="text-3xl font-bold">
              {submissionCount.daily} / {competition.daily_submission_limit || 5}
            </div>
            <div className="text-xs text-text-tertiary mt-1">
              {Math.max(
                0,
                (competition.daily_submission_limit || 5) - submissionCount.daily
              )}{' '}
              remaining today
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
        />

        {/* Recent Submissions */}
        <Card className="p-8 mt-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Target className="w-6 h-6 text-accent-cyan" />
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
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Submitted At
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {sortedSubmissions.map((submission: any, index: number) => (
                    <tr
                      key={submission.id}
                      className={`hover:bg-bg-tertiary/50 ${submission.is_best_score ? 'bg-success/5' : ''}`}
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
                      <td className="px-4 py-3 text-sm text-text-secondary">
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
