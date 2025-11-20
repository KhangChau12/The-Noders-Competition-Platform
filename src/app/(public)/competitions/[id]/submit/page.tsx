import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import SubmitForm from './SubmitForm';
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

  // Count daily and total submissions
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const dailySubmissions = submissions?.filter(
    (sub: any) => new Date(sub.submitted_at) >= todayStart
  );

  const submissionCount = {
    daily: dailySubmissions?.length || 0,
    total: submissions?.length || 0,
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
          <h1 className="font-display text-4xl sm:text-5xl mb-2 gradient-text">
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

          {submissions && submissions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border-default">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">#</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Score</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Phase</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      Submitted At
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {submissions.map((submission: any, index: number) => (
                    <tr key={submission.id} className="hover:bg-bg-tertiary/50">
                      <td className="px-4 py-3 text-sm">{submissions.length - index}</td>
                      <td className="px-4 py-3">
                        <span className="font-mono font-medium">
                          {submission.score?.toFixed(4) || 'N/A'}
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
                        {submission.is_best_score && (
                          <Badge variant="success">Best Score</Badge>
                        )}
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
