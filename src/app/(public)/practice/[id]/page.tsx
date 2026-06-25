import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import PracticeTabs from './PracticeTabs';
import { SCORING_METRIC_INFO, PRACTICE_DIFFICULTY_INFO } from '@/lib/constants';
import type { PracticeTag } from '@/types/database.types';
import { ArrowLeft, Target, Users, Zap } from 'lucide-react';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PracticeProblemPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

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

  const myBestScore = mySubmissions.find((s) => s.is_best_score && s.validation_status === 'valid');
  const myRankIndex = myBestScore ? leaderboard.findIndex((e: { userId: string }) => e.userId === user?.id) : -1;
  const myRank = myRankIndex >= 0 ? myRankIndex + 1 : null;

  return (
    <div className="min-h-screen">
      {/* ── Hero header ── */}
      <div className="px-4 sm:px-6 pt-8 pb-6 sm:pt-10 sm:pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <Link
            href="/practice"
            className="inline-flex items-center gap-1.5 text-sm text-text-tertiary hover:text-text-secondary transition-colors mb-5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Practice
          </Link>

          {/* Difficulty + tags */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {diffInfo && (
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${diffInfo.bgColor} ${diffInfo.color} ${diffInfo.borderColor}`}>
                {diffInfo.label}
              </span>
            )}
            {tags.map((tag) => (
              <span
                key={tag.id}
                className="text-xs px-2.5 py-0.5 rounded-full bg-bg-elevated border border-border-default text-text-tertiary"
              >
                {tag.name}
              </span>
            ))}
          </div>

          {/* Title */}
          <h1 className="font-brand text-3xl sm:text-4xl lg:text-5xl mb-3 gradient-text leading-tight">
            {problem.title}
          </h1>

          {/* Description */}
          <p className="text-sm sm:text-base text-text-secondary mb-5 max-w-3xl leading-relaxed">
            {problem.description}
          </p>

          {/* Quick stats row */}
          <div className="flex items-center gap-4 sm:gap-6 overflow-x-auto scrollbar-none pb-1 text-sm text-text-secondary">
            <div className="flex items-center gap-1.5 shrink-0">
              <Target className="w-4 h-4 text-text-tertiary" />
              <span>
                {metricInfo?.name ?? problem.scoring_metric}
                {metricInfo?.higher_is_better === false ? ' ↓' : ' ↑'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Users className="w-4 h-4 text-text-tertiary" />
              <span>{leaderboard.length} participants</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Zap className="w-4 h-4 text-text-tertiary" />
              {/* Split into two tokens so they stay together but don't form one very long string */}
              <span>{problem.daily_submission_limit}/day</span>
              <span className="text-text-disabled">·</span>
              <span>
                {problem.total_submission_limit === 0 ? 'Unlimited' : `${problem.total_submission_limit} total`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main body ── */}
      <div className="px-4 sm:px-6 pb-12">
        <div className="max-w-7xl mx-auto">
          <PracticeTabs
            problem={{ ...problem, tags }}
            leaderboard={leaderboard}
            mySubmissions={mySubmissions}
            currentUserId={user?.id ?? null}
            isAuthenticated={!!user}
            myBestScore={myBestScore ?? null}
            myRank={myRank}
          />
        </div>
      </div>
    </div>
  );
}
