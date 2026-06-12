import React from 'react';
import Link from 'next/link';
import { Card } from '../ui/Card';
import { Users, Tag, CheckCircle2, Crown } from 'lucide-react';
import { SCORING_METRIC_INFO, PRACTICE_DIFFICULTY_INFO } from '@/lib/constants';
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

const DIFFICULTY_EDGE: Record<string, string> = {
  beginner: 'before:bg-success/70',
  intermediate: 'before:bg-warning/70',
  advanced: 'before:bg-error/70',
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
  const edge = problem.difficulty ? DIFFICULTY_EDGE[problem.difficulty] : null;

  return (
    <Link href={`/practice/${problem.id}`} className="group block h-full">
      <Card
        className={`relative p-4 sm:p-6 hover:border-border-focus transition-all glow-on-hover h-full flex flex-col overflow-hidden ${
          edge
            ? `before:absolute before:inset-x-0 before:top-0 before:h-[3px] before:rounded-t-xl ${edge}`
            : ''
        } ${className}`}
      >
        {/* Classification pills: difficulty + attempted state */}
        <div className="flex items-center gap-2 mb-3">
          {diffInfo && (
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${diffInfo.bgColor} ${diffInfo.color} ${diffInfo.borderColor}`}
            >
              {diffInfo.label}
            </span>
          )}
          {hasBest && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border bg-accent-cyan/10 text-accent-cyan border-accent-cyan/20">
              <CheckCircle2 className="h-3 w-3" />
              {yourRank ? `Your rank #${yourRank}` : 'Attempted'}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg sm:text-xl font-bold text-text-primary mb-1 line-clamp-2 group-hover:text-primary-blue transition-colors">
          {problem.title}
        </h3>

        {/* Metric / task meta */}
        <p className="text-xs font-mono uppercase tracking-wide text-text-tertiary mb-2">
          {metricInfo?.name ?? problem.scoring_metric.replace('_', ' ')}
          {' · '}
          {metricInfo?.type === 'regression' ? 'Regression' : 'Classification'}
        </p>

        {/* Description */}
        <p className="text-text-secondary text-sm leading-relaxed mb-3 sm:mb-4 line-clamp-2 flex-grow">
          {problem.description}
        </p>

        {/* Tags as plain text */}
        {(problem.tags?.length ?? 0) > 0 && (
          <p className="text-xs text-text-tertiary mb-3 sm:mb-4 line-clamp-1">
            <Tag className="inline h-3 w-3 mr-1.5 align-[-1px]" />
            {problem.tags!.map((tag) => tag.name).join(', ')}
          </p>
        )}

        {/* Footer: community stats vs your standing */}
        <div className="mt-auto pt-3.5 border-t border-border-default">
          <div className="flex items-center justify-between gap-3 text-sm text-text-tertiary">
            <span className="flex items-center gap-3 min-w-0">
              <span className="flex items-center gap-1.5 shrink-0">
                <Users className="h-3.5 w-3.5" />
                <span className="text-xs font-mono">{participants}</span>
              </span>
              {hasTop && (
                <span className="flex items-center gap-1.5 min-w-0">
                  <Crown className="h-3.5 w-3.5 text-warning shrink-0" />
                  <span className="text-xs font-mono truncate text-text-secondary">
                    {topScore!.toFixed(decimals)}
                  </span>
                </span>
              )}
            </span>
            {hasBest ? (
              <span className="font-mono text-xs text-text-secondary shrink-0">
                You:{' '}
                <span className="font-semibold text-accent-cyan">
                  {bestScore!.toFixed(decimals)}
                </span>
              </span>
            ) : (
              <span className="text-primary-blue text-sm font-semibold shrink-0 group-hover:translate-x-0.5 transition-transform">
                {participants === 0 ? 'Be first →' : 'Solve →'}
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default PracticeProblemCard;
