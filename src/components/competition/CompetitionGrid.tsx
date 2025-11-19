'use client';

import React from 'react';
import CompetitionCard from './CompetitionCard';
import { SkeletonCard } from '../ui/Skeleton';

interface Competition {
  id: string;
  title: string;
  description: string;
  competition_type: '3-phase' | '4-phase';
  participation_type: 'individual' | 'team';
  registration_start: string;
  registration_end: string;
  public_test_start: string;
  public_test_end: string;
  scoring_metric: string;
}

interface CompetitionGridProps {
  competitions: Competition[];
  getPhase: (competition: Competition) => 'upcoming' | 'registration' | 'public_test' | 'private_test' | 'ended';
  getStats?: (competitionId: string) => {
    participants: number;
    submissions: number;
    daysRemaining: number;
  };
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

const CompetitionGrid: React.FC<CompetitionGridProps> = ({
  competitions,
  getPhase,
  getStats,
  loading = false,
  emptyMessage = 'No competitions available at the moment.',
  className = '',
}) => {
  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
        {Array.from({ length: 6 }, (_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    );
  }

  if (competitions.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🏆</div>
        <h3 className="text-xl font-semibold text-text-primary mb-2">
          No Competitions Found
        </h3>
        <p className="text-text-secondary max-w-md mx-auto">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {competitions.map((competition) => (
        <CompetitionCard
          key={competition.id}
          competition={competition}
          phase={getPhase(competition)}
          stats={getStats?.(competition.id)}
        />
      ))}
    </div>
  );
};

export default CompetitionGrid;
