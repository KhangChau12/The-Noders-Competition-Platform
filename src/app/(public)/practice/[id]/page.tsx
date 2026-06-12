import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import PracticeTabs from './PracticeTabs';
import { SCORING_METRIC_INFO, PRACTICE_DIFFICULTY_INFO } from '@/lib/constants';
import type { PracticeTag } from '@/types/database.types';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PracticeProblemPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  // Get current user (may be null)
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch problem + tags
  const { data: problem } = await (supabase as any)
    .from('practice_problems')
    .select('*, practice_problem_tags(tag_id, practice_tags(id, name, slug))')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (!problem) notFound();

  const tags = (problem.practice_problem_tags ?? [])
    .map((pt: any) => pt.practice_tags)
    .filter(Boolean) as PracticeTag[];

  // Fetch leaderboard: best scores per user, joined with user name
  const { data: leaderboardRaw } = await (supabase as any)
    .from('practice_submissions')
    .select('user_id, score, submitted_at, users(full_name)')
    .eq('problem_id', id)
    .eq('is_best_score', true)
    .eq('validation_status', 'valid')
    .not('score', 'is', null)
    .order('score', { ascending: SCORING_METRIC_INFO[problem.scoring_metric as keyof typeof SCORING_METRIC_INFO]?.higher_is_better === false })
    .limit(100);

  const leaderboard = (leaderboardRaw ?? []).map((row: any, index: number) => ({
    rank: index + 1,
    userId: row.user_id,
    userName: (row.users as any)?.full_name ?? null,
    score: row.score,
    totalSubmissions: 1,
    lastSubmissionAt: row.submitted_at,
  }));

  // Fetch current user's submissions
  let mySubmissions: any[] = [];
  if (user) {
    const { data } = await (supabase as any)
      .from('practice_submissions')
      .select('id, score, is_best_score, validation_status, validation_errors, file_name, submitted_at')
      .eq('problem_id', id)
      .eq('user_id', user.id)
      .order('submitted_at', { ascending: false })
      .limit(50);
    mySubmissions = data ?? [];
  }

  const metricInfo = SCORING_METRIC_INFO[problem.scoring_metric as keyof typeof SCORING_METRIC_INFO];
  const diffInfo = problem.difficulty
    ? PRACTICE_DIFFICULTY_INFO[problem.difficulty as keyof typeof PRACTICE_DIFFICULTY_INFO]
    : null;

  return (
    <div className="min-h-screen px-4 sm:px-6 py-8 sm:py-12">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-text-tertiary mb-8">
          <Link href="/practice" className="hover:text-text-secondary transition-colors">Practice</Link>
          <span>/</span>
          <span className="text-text-secondary line-clamp-1">{problem.title}</span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-8">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              {diffInfo && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${diffInfo.bgColor} ${diffInfo.color} ${diffInfo.borderColor}`}>
                  {diffInfo.label}
                </span>
              )}
              <span className="text-xs font-mono uppercase tracking-wide text-text-tertiary">
                {metricInfo?.name ?? problem.scoring_metric}
                {tags.length > 0 && <> &middot; {tags.map((tag) => tag.name).join(', ')}</>}
              </span>
            </div>

            <h1 className="font-brand text-2xl sm:text-3xl md:text-4xl gradient-text mb-3 leading-tight">
              {problem.title}
            </h1>
            <p className="text-text-secondary max-w-3xl text-sm sm:text-base">{problem.description}</p>
          </div>

          <div className="shrink-0">
            {user ? (
              <Link href={`/practice/${id}/submit`} className="block">
                <Button variant="primary" size="lg" className="w-full sm:w-auto">Submit Solution</Button>
              </Link>
            ) : (
              <Link href="/login" className="block">
                <Button variant="primary" size="lg" className="w-full sm:w-auto">Log in to Submit</Button>
              </Link>
            )}
          </div>
        </div>

        {/* Tabs */}
        <PracticeTabs
          problem={{ ...problem, tags }}
          leaderboard={leaderboard}
          mySubmissions={mySubmissions}
          currentUserId={user?.id ?? null}
          isAuthenticated={!!user}
        />
      </div>
    </div>
  );
}
