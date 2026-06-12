'use client';

import React from 'react';
import Link from 'next/link';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { Clock, Users, Calendar } from 'lucide-react';

type CompetitionPhase = 'upcoming' | 'registration' | 'public_test' | 'private_test' | 'ended';

interface CompetitionCardProps {
  competition: {
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
  };
  phase: CompetitionPhase;
  stats?: {
    participants: number;
    submissions?: number;
    daysRemaining?: number;
  };
  countdown?: {
    days: number;
    hours: number;
    minutes: number;
    label: string;
  };
  registrationStatus?: 'not_registered' | 'pending' | 'approved' | 'rejected';
  showRegistrationBadge?: boolean;
  className?: string;
}

const CompetitionCard: React.FC<CompetitionCardProps> = ({
  competition,
  phase,
  stats,
  countdown,
  registrationStatus,
  showRegistrationBadge = false,
  className = '',
}) => {
  const phaseConfig = {
    upcoming: { label: 'Coming Soon', variant: 'secondary' as const },
    registration: { label: 'Registration Open', variant: 'registration' as const },
    public_test: { label: 'Public Test', variant: 'public' as const },
    private_test: { label: 'Private Test', variant: 'private' as const },
    ended: { label: 'Ended', variant: 'ended' as const },
  };

  const phaseInfo = phaseConfig[phase];

  const registrationBadge = () => {
    if (!showRegistrationBadge || !registrationStatus) return null;

    const statusConfig = {
      not_registered: null,
      pending: { label: 'Pending Approval', variant: 'yellow' as const },
      approved: { label: 'Registered', variant: 'green' as const },
      rejected: { label: 'Rejected', variant: 'red' as const },
    };

    const config = statusConfig[registrationStatus];
    if (!config) return null;

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <Link href={`/competitions/${competition.id}`} className="group block h-full">
      <Card className={`p-5 sm:p-6 hover:border-border-focus transition-all glow-on-hover h-full flex flex-col ${
        phase === 'registration' ? 'ring-1 ring-primary-blue/30 shadow-glow-blue-sm' : ''
      } ${className}`}>
        {/* Header with Badges */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <Badge variant={phaseInfo.variant}>{phaseInfo.label}</Badge>
          <Badge variant="tech">
            {competition.scoring_metric.replace('_', ' ').toUpperCase()}
          </Badge>
          {competition.participation_type === 'team' && (
            <Badge variant="outline">Team</Badge>
          )}
          {registrationBadge()}
        </div>

        {/* Title */}
        <h3 className="text-lg sm:text-xl font-bold text-text-primary mb-2 line-clamp-2 group-hover:text-primary-blue transition-colors">
          {competition.title}
        </h3>

        {/* Description */}
        <p className="text-text-secondary text-sm leading-relaxed mb-4 line-clamp-3 flex-grow">
          {competition.description}
        </p>

        {/* Timeline */}
        <div className="space-y-1.5 text-xs mb-4">
          <div className="flex items-center gap-2 text-text-secondary">
            <Calendar className="h-3.5 w-3.5 text-text-tertiary shrink-0" />
            <span>
              <span className="text-text-tertiary">Registration:</span>{' '}
              {formatDate(competition.registration_start)} &ndash; {formatDate(competition.registration_end)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-text-secondary">
            <Clock className="h-3.5 w-3.5 text-text-tertiary shrink-0" />
            <span>
              <span className="text-text-tertiary">Public test ends:</span>{' '}
              {formatDate(competition.public_test_end)}
            </span>
          </div>
        </div>

        {/* Countdown Timer */}
        {countdown && (
          <div className="mb-4 p-3 bg-bg-elevated rounded-lg border border-border-default">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-primary-blue" />
              <span className="text-xs text-text-tertiary uppercase font-mono">
                {countdown.label}
              </span>
            </div>
            <div className="flex gap-3">
              <div className="flex-1 text-center">
                <div className="text-2xl font-bold text-primary-blue font-mono">
                  {countdown.days}
                </div>
                <div className="text-xs text-text-tertiary">Days</div>
              </div>
              <div className="flex-1 text-center">
                <div className="text-2xl font-bold text-primary-blue font-mono">
                  {countdown.hours}
                </div>
                <div className="text-xs text-text-tertiary">Hours</div>
              </div>
              <div className="flex-1 text-center">
                <div className="text-2xl font-bold text-primary-blue font-mono">
                  {countdown.minutes}
                </div>
                <div className="text-xs text-text-tertiary">Mins</div>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-center gap-2 p-2 bg-bg-elevated rounded-lg">
              <Users className="h-4 w-4 text-text-tertiary" />
              <div>
                <div className="text-lg font-bold text-text-primary font-mono">
                  {stats.participants}
                </div>
                <div className="text-xs text-text-tertiary">Participants</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 bg-bg-elevated rounded-lg">
              <Calendar className="h-4 w-4 text-text-tertiary" />
              <div>
                <div className="text-xs font-medium text-text-secondary">
                  {competition.competition_type === '3-phase' ? '3-Phase' : '4-Phase'}
                </div>
                <div className="text-xs text-text-tertiary">Competition</div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto pt-4 border-t border-border-default">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-tertiary">
              {competition.competition_type === '4-phase' ? '4-phase format' : '3-phase format'}
            </span>
            <span className="font-semibold text-primary-blue group-hover:translate-x-0.5 transition-transform">
              View details &rarr;
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default CompetitionCard;
