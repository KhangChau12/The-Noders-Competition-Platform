import React from 'react';
import Link from 'next/link';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { Users, BookOpen, Tag } from 'lucide-react';
import { SCORING_METRIC_INFO, PRACTICE_DIFFICULTY_INFO } from '@/lib/constants';
import type { PracticeProblemRow, PracticeTag } from '@/types/database.types';

interface Props {
  problem: PracticeProblemRow & {
    tags?: PracticeTag[];
    participant_count?: number;
  };
  className?: string;
}

const PracticeProblemCard: React.FC<Props> = ({ problem, className = '' }) => {
  const metricInfo = SCORING_METRIC_INFO[problem.scoring_metric as keyof typeof SCORING_METRIC_INFO];
  const diffInfo = problem.difficulty
    ? PRACTICE_DIFFICULTY_INFO[problem.difficulty as keyof typeof PRACTICE_DIFFICULTY_INFO]
    : null;

  return (
    <Link href={`/practice/${problem.id}`}>
      <Card
        className={`p-6 hover:border-border-focus transition-all glow-on-hover h-full flex flex-col ${className}`}
      >
        {/* Badges row */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <Badge variant="tech">
            {metricInfo?.name ?? problem.scoring_metric.replace('_', ' ').toUpperCase()}
          </Badge>
          {diffInfo && (
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${diffInfo.bgColor} ${diffInfo.color} ${diffInfo.borderColor}`}
            >
              {diffInfo.label}
            </span>
          )}
          {problem.tags?.slice(0, 2).map((tag) => (
            <Badge key={tag.id} variant="outline">
              {tag.name}
            </Badge>
          ))}
          {(problem.tags?.length ?? 0) > 2 && (
            <span className="text-xs text-text-tertiary">+{(problem.tags?.length ?? 0) - 2} more</span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-text-primary mb-2 line-clamp-2">
          {problem.title}
        </h3>

        {/* Description */}
        <p className="text-text-secondary text-sm leading-relaxed mb-4 line-clamp-3 flex-grow">
          {problem.description}
        </p>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2 p-2 bg-bg-elevated rounded-lg">
            <Users className="h-4 w-4 text-text-tertiary" />
            <div>
              <div className="text-lg font-bold text-text-primary font-mono">
                {problem.participant_count ?? 0}
              </div>
              <div className="text-xs text-text-tertiary">Participants</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 bg-bg-elevated rounded-lg">
            <Tag className="h-4 w-4 text-text-tertiary" />
            <div>
              <div className="text-xs font-medium text-text-secondary">
                {metricInfo?.type === 'regression' ? 'Regression' : 'Classification'}
              </div>
              <div className="text-xs text-text-tertiary">Task type</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-4 border-t border-border-default">
          <div className="flex items-center justify-between text-sm text-text-tertiary">
            <span>Practice anytime, no deadline</span>
            <BookOpen className="h-4 w-4" />
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default PracticeProblemCard;
