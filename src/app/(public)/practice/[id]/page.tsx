import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import PracticeTabs from './PracticeTabs';
import { SCORING_METRIC_INFO, PRACTICE_DIFFICULTY_INFO } from '@/lib/constants';
import type { PracticeTag } from '@/types/database.types';
import { ArrowLeft } from 'lucide-react';

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
      {/* ── Header area ── */}
      <div className="px-4 sm:px-6 pt-6 sm:pt-8 pb-5 sm:pb-6">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb */}
          <Link
            href="/practice"
            className="inline-flex items-center gap-1.5 text-sm text-text-tertiary hover:text-text-secondary transition-colors mb-5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Practice
          </Link>

          {/* Difficulty + meta badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {diffInfo && (
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${diffInfo.bgColor} ${diffInfo.color} ${diffInfo.borderColor}`}>
                {diffInfo.label}
              </span>
            )}
            <span className="text-xs font-mono uppercase tracking-wide text-text-tertiary">
              {metricInfo?.name ?? problem.scoring_metric}
            </span>
            {tags.length > 0 && tags.map((tag) => (
              <span
                key={tag.id}
                className="text-xs px-2 py-0.5 rounded-full bg-bg-elevated border border-border-default text-text-tertiary"
              >
                {tag.name}
              </span>
            ))}
          </div>

          {/* Title */}
          <h1 className="font-brand text-2xl sm:text-3xl md:text-4xl gradient-text leading-tight mb-3">
            {problem.title}
          </h1>

          {/* Description */}
          <p className="text-text-secondary text-sm sm:text-base leading-relaxed max-w-3xl mb-5">
            {problem.description}
          </p>

          {/* Personal stats strip (if user has submitted) */}
          {user && myBestScore && (
            <div className="flex flex-wrap items-center gap-3 sm:gap-6 py-3 px-4 bg-bg-surface rounded-xl border border-border-default/60 mb-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-text-disabled">Best Score</p>
                <p className="font-mono font-bold text-primary-blue text-base leading-tight">
                  {myBestScore.score.toFixed(metricInfo?.decimals ?? 4)}
                </p>
              </div>
              {myRank && myRank > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-text-disabled">Your Rank</p>
                  <p className="font-bold text-text-primary text-base leading-tight">
                    #{myRank}
                    <span className="text-text-tertiary font-normal text-xs ml-1">/ {leaderboard.length}</span>
                  </p>
                </div>
              )}
              <div className="ml-auto">
                <Link href={`/practice/${id}/submit`}>
                  <Button variant="primary" size="sm">Submit Again</Button>
                </Link>
              </div>
            </div>
          )}

          {/* Submit CTA for unattempted / guests */}
          {(!user || !myBestScore) && (
            <div className="flex justify-start">
              {user ? (
                <Link href={`/practice/${id}/submit`}>
                  <Button variant="primary" size="sm">Submit Solution</Button>
                </Link>
              ) : (
                <Link href="/login">
                  <Button variant="primary" size="sm">Log in to Submit</Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="px-4 sm:px-6 pb-12">
        <div className="max-w-6xl mx-auto">
          <PracticeTabs
            problem={{ ...problem, tags }}
            leaderboard={leaderboard}
            mySubmissions={mySubmissions}
            currentUserId={user?.id ?? null}
            isAuthenticated={!!user}
          />
        </div>
      </div>
    </div>
  );
}
