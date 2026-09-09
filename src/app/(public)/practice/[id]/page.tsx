import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import PracticeTabs from './PracticeTabs';
import { StatRun, type StatItem } from '@/components/ui/StatRun';
import { SCORING_METRIC_INFO, PRACTICE_DIFFICULTY_INFO } from '@/lib/constants';
import type { PracticeTag } from '@/types/database.types';
import { ArrowLeft } from 'lucide-react';

interface Props {
  params: Promise<{ id: string }>;
}

const DIFF_COLOR: Record<string, string> = {
  beginner: 'text-success',
  intermediate: 'text-[#FBBF24]',
  advanced: 'text-[#F87171]',
};

export default async function PracticeProblemPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  // Fetch the problem first (its scoring_metric decides the leaderboard sort
  // direction), then fetch the leaderboard and the user's own submissions
  // concurrently — those two don't depend on each other.
  const { data: problem } = await (supabase as any)
    .from('practice_problems')
    .select('id, title, description, problem_statement, scoring_metric, dataset_url, sample_submission_url, daily_submission_limit, total_submission_limit, max_file_size_mb, difficulty, created_by, created_at, updated_at, deleted_at, practice_problem_tags(tag_id, practice_tags(id, name, slug))')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (!problem) notFound();

  const tags = (problem.practice_problem_tags ?? [])
    .map((pt: any) => pt.practice_tags)
    .filter(Boolean) as PracticeTag[];

  const higherIsBetter =
    SCORING_METRIC_INFO[problem.scoring_metric as keyof typeof SCORING_METRIC_INFO]?.higher_is_better !== false;

  const [{ data: leaderboardRaw }, { data: mySubmissionsData }] = await Promise.all([
    (supabase as any)
      .from('practice_submissions')
      .select('user_id, score, submitted_at, users(full_name)')
      .eq('problem_id', id)
      .eq('is_best_score', true)
      .eq('validation_status', 'valid')
      .not('score', 'is', null)
      .order('score', { ascending: !higherIsBetter })
      .limit(100),
    user
      ? (supabase as any)
          .from('practice_submissions')
          .select('id, score, is_best_score, validation_status, validation_errors, file_name, submitted_at')
          .eq('problem_id', id)
          .eq('user_id', user.id)
          .order('submitted_at', { ascending: false })
          .limit(50)
      : Promise.resolve({ data: [] }),
  ]);

  const leaderboard = (leaderboardRaw ?? []).map((row: any, index: number) => ({
    rank: index + 1,
    userId: row.user_id,
    userName: (row.users as any)?.full_name ?? null,
    score: row.score,
    totalSubmissions: 1,
    lastSubmissionAt: row.submitted_at,
  }));

  const mySubmissions: any[] = mySubmissionsData ?? [];

  const metricInfo = SCORING_METRIC_INFO[problem.scoring_metric as keyof typeof SCORING_METRIC_INFO];
  const diffInfo = problem.difficulty
    ? PRACTICE_DIFFICULTY_INFO[problem.difficulty as keyof typeof PRACTICE_DIFFICULTY_INFO]
    : null;

  const myBestScore = mySubmissions.find((s) => s.is_best_score && s.validation_status === 'valid');
  const myRankIndex = myBestScore ? leaderboard.findIndex((e: { userId: string }) => e.userId === user?.id) : -1;
  const myRank = myRankIndex >= 0 ? myRankIndex + 1 : null;
  const decimals = metricInfo?.decimals ?? 4;

  const heroStats: StatItem[] = [
    {
      label: 'Scoring metric',
      value: `${metricInfo?.name ?? problem.scoring_metric} ${metricInfo?.higher_is_better === false ? '↓' : '↑'}`,
      tone: 'blue',
    },
    { label: 'Participants', value: String(leaderboard.length) },
    {
      label: 'Daily limit',
      value: (
        <>
          {problem.daily_submission_limit}
          <span className="text-xs font-normal text-text-disabled"> / day</span>
        </>
      ),
    },
    {
      label: 'Total limit',
      value: problem.total_submission_limit === 0 ? '∞' : String(problem.total_submission_limit),
    },
  ];
  if (myBestScore && myRank) {
    heroStats.push({ label: 'Your rank', value: `#${myRank}`, tone: 'cyan' });
  }

  return (
    <div className="min-h-screen px-4 sm:px-6 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto">

        {/* Breadcrumb */}
        <Link
          href="/practice"
          className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-text-tertiary hover:text-text-secondary transition-colors mb-3.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Practice
        </Link>

        {/* Eyebrow — difficulty word + tag facts */}
        <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2 mb-2.5 text-xs">
          {diffInfo && problem.difficulty && (
            <span className={`font-extrabold uppercase tracking-[0.06em] ${DIFF_COLOR[problem.difficulty]}`}>
              {diffInfo.label}
            </span>
          )}
          {tags.map((tag) => (
            <span key={tag.id} className="font-semibold text-text-tertiary">
              {tag.name}
            </span>
          ))}
        </div>

        {/* Title */}
        <h1 className="font-brand text-[1.375rem] sm:text-3xl leading-[1.12] text-text-primary mb-2.5">
          {problem.title}
        </h1>

        {/* Description */}
        <p className="text-sm text-text-secondary leading-[1.55] max-w-[72ch] line-clamp-3 mb-4">
          {problem.description}
        </p>

        {/* Hero stat run */}
        <StatRun items={heroStats} className="mb-5" />

        <PracticeTabs
          problem={{ ...problem, tags }}
          leaderboard={leaderboard}
          mySubmissions={mySubmissions}
          currentUserId={user?.id ?? null}
          isAuthenticated={!!user}
          myBestScore={myBestScore ?? null}
          myRank={myRank}
          decimals={decimals}
        />
      </div>
    </div>
  );
}
