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
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-text-tertiary mb-8">
          <Link href="/practice" className="hover:text-text-secondary transition-colors">Practice</Link>
          <span>/</span>
          <span className="text-text-secondary line-clamp-1">{problem.title}</span>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between gap-6 mb-8 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <Badge variant="tech">{metricInfo?.name ?? problem.scoring_metric}</Badge>
              {diffInfo && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${diffInfo.bgColor} ${diffInfo.color} ${diffInfo.borderColor}`}>
                  {diffInfo.label}
                </span>
              )}
              {tags.map((tag) => (
                <Badge key={tag.id} variant="outline">{tag.name}</Badge>
              ))}
            </div>

            <h1 className="font-brand text-3xl sm:text-4xl gradient-text mb-3">
              {problem.title}
            </h1>
            <p className="text-text-secondary max-w-3xl">{problem.description}</p>
          </div>

          <div className="flex-shrink-0">
            {user ? (
              <Link href={`/practice/${id}/submit`}>
                <Button variant="primary" size="lg">Submit Solution</Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button variant="primary" size="lg">Log in to Submit</Button>
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
