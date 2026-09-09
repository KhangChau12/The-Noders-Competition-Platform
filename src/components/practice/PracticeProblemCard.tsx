import React from 'react';
import Link from 'next/link';
import { SCORING_METRIC_INFO, PRACTICE_DIFFICULTY_INFO, metricShortName } from '@/lib/constants';
import type { PracticeProblemRow, PracticeTag } from '@/types/database.types';

interface Props {
  problem: PracticeProblemRow & {
    tags?: PracticeTag[];
    participant_count?: number;
  };
  /** Logged-in user's best score on this problem, if any */
  bestScore?: number | null;
  /** Best score on the global leaderboard for this problem */
  topScore?: number | null;
  /** Logged-in user's leaderboard rank on this problem */
  yourRank?: number | null;
  className?: string;
}

// difficulty → a coloured word (label size), not a pill
const DIFF_COLOR: Record<string, string> = {
  beginner: 'text-success',
  intermediate: 'text-[#FBBF24]',
  advanced: 'text-[#F87171]',
};
const DIFF_EDGE: Record<string, string> = {
  beginner: 'before:bg-success/70',
  intermediate: 'before:bg-[#FBBF24]/70',
  advanced: 'before:bg-[#F87171]/70',
};

const PracticeProblemCard: React.FC<Props> = ({
  problem,
  bestScore,
  topScore,
  yourRank,
  className = '',
}) => {
  const metricInfo = SCORING_METRIC_INFO[problem.scoring_metric as keyof typeof SCORING_METRIC_INFO];
  const diffInfo = problem.difficulty
    ? PRACTICE_DIFFICULTY_INFO[problem.difficulty as keyof typeof PRACTICE_DIFFICULTY_INFO]
    : null;
  const hasBest = bestScore !== null && bestScore !== undefined;
  const hasTop = topScore !== null && topScore !== undefined;
  const decimals = metricInfo?.decimals ?? 4;
  const participants = problem.participant_count ?? 0;
  const edge = problem.difficulty ? DIFF_EDGE[problem.difficulty] : null;
  const diffColor = problem.difficulty ? DIFF_COLOR[problem.difficulty] : '';

  return (
    <Link href={`/practice/${problem.id}`} className="group block h-full">
      <div
        className={`relative h-full flex flex-col gap-3 rounded-xl border border-border-default bg-bg-surface p-4 sm:p-[18px] overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:border-border-focus ${
          edge
            ? `before:absolute before:inset-x-0 before:top-0 before:h-[3px] before:rounded-t-xl ${edge}`
            : ''
        } ${className}`}
      >
        {/* eyebrow: difficulty word + attempted / rank */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
          {diffInfo && (
            <span className={`font-extrabold uppercase tracking-[0.06em] ${diffColor}`}>
              {diffInfo.label}
            </span>
          )}
          {hasBest && (
            <span className="font-mono font-bold text-[#22D3EE]">
              {yourRank ? `✓ your rank #${yourRank}` : '✓ Attempted'}
            </span>
          )}
        </div>

        <div>
          <h3 className="text-lg font-extrabold leading-[1.25] text-text-primary mb-1.5 line-clamp-2 group-hover:text-primary-blue transition-colors">
            {problem.title}
          </h3>
          <p className="text-xs font-semibold uppercase tracking-[0.06em] text-text-tertiary mb-2">
            {metricShortName(problem.scoring_metric)} ·{' '}
            {metricInfo?.type === 'regression' ? 'Regression' : 'Classification'}
          </p>
          <p className="text-sm text-text-secondary leading-[1.55] line-clamp-2">
            {problem.description}
          </p>
        </div>

        {(problem.tags?.length ?? 0) > 0 && (
          <p className="text-xs text-text-disabled line-clamp-1">
            🏷 {problem.tags!.map((tag) => tag.name).join(', ')}
          </p>
        )}

        <div className="mt-auto pt-1 flex items-center justify-between gap-3">
          <span className="text-sm text-text-tertiary truncate">
            <b className="font-mono font-bold text-text-primary">{participants}</b> people
            {hasTop && (
              <>
                {' · '}top{' '}
                <span className="font-mono text-text-secondary">{topScore!.toFixed(decimals)}</span>
              </>
            )}
            {hasBest && (
              <>
                {' · '}you{' '}
                <span className="font-mono text-[#22D3EE]">{bestScore!.toFixed(decimals)}</span>
              </>
            )}
          </span>
          {!hasBest && (
            <span className="text-xs font-bold text-[#60A5FA] shrink-0 group-hover:translate-x-0.5 transition-transform">
              {participants === 0 ? 'Be first →' : 'Solve →'}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default PracticeProblemCard;
