'use client';

import { CheckCircle2, Circle, Clock } from 'lucide-react';

interface HorizontalTimelineProps {
  competition: any;
}

type PhaseStatus = 'completed' | 'active' | 'upcoming';

interface Phase {
  id: string;
  label: string;
  shortLabel: string;
  start: Date;
  end: Date;
  status: PhaseStatus;
}

export default function HorizontalTimeline({ competition }: HorizontalTimelineProps) {
  const now = new Date();

  // Build phases array
  const phases: Phase[] = [];

  // Registration phase
  const regStart = new Date(competition.registration_start);
  const regEnd = new Date(competition.registration_end);
  phases.push({
    id: 'registration',
    label: 'Registration',
    shortLabel: 'Reg',
    start: regStart,
    end: regEnd,
    status: now < regStart ? 'upcoming' : now <= regEnd ? 'active' : 'completed'
  });

  // Public test phase
  const publicStart = new Date(competition.public_test_start);
  const publicEnd = new Date(competition.public_test_end);
  phases.push({
    id: 'public',
    label: 'Public Test',
    shortLabel: 'Public',
    start: publicStart,
    end: publicEnd,
    status: now < publicStart ? 'upcoming' : now <= publicEnd ? 'active' : 'completed'
  });

  // Private test phase (only for 4-phase)
  if (competition.competition_type === '4-phase' && competition.private_test_start) {
    const privateStart = new Date(competition.private_test_start);
    const privateEnd = new Date(competition.private_test_end);
    phases.push({
      id: 'private',
      label: 'Private Test',
      shortLabel: 'Private',
      start: privateStart,
      end: privateEnd,
      status: now < privateStart ? 'upcoming' : now <= privateEnd ? 'active' : 'completed'
    });
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getStatusColor = (status: PhaseStatus) => {
    switch (status) {
      case 'completed':
        return {
          dot: 'bg-success',
          text: 'text-success',
        };
      case 'active':
        return {
          dot: 'bg-primary-blue',
          text: 'text-primary-blue',
        };
      case 'upcoming':
        return {
          dot: 'bg-bg-elevated border-2 border-border-default',
          text: 'text-text-tertiary',
        };
    }
  };

  return (
    <div className="w-full px-4">
      {/* Timeline container */}
      <div className="relative">
        {/* Connecting lines - positioned behind nodes */}
        <div className="absolute top-4 left-0 right-0 flex items-center" style={{ zIndex: 0 }}>
          {phases.map((phase, index) => {
            if (index === phases.length - 1) return null;

            const widthPercent = 100 / phases.length;
            const leftPercent = (index * widthPercent) + (widthPercent / 2);

            return (
              <div
                key={`line-${phase.id}`}
                className="absolute h-0.5"
                style={{
                  left: `${leftPercent}%`,
                  width: `${widthPercent}%`,
                }}
              >
                <div className={`h-full ${
                  phase.status === 'completed' ? 'bg-success' : 'bg-border-default'
                }`} />
              </div>
            );
          })}
        </div>

        {/* Phase nodes */}
        <div className="relative flex justify-between" style={{ zIndex: 1 }}>
          {phases.map((phase) => {
            const colors = getStatusColor(phase.status);

            return (
              <div key={phase.id} className="flex flex-col items-center" style={{ width: `${100 / phases.length}%` }}>
                {/* Status icon */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colors.dot}`}>
                  {phase.status === 'completed' && (
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  )}
                  {phase.status === 'active' && (
                    <Clock className="w-4 h-4 text-white animate-pulse" />
                  )}
                  {phase.status === 'upcoming' && (
                    <Circle className="w-4 h-4 text-text-tertiary" />
                  )}
                </div>

                {/* Phase info */}
                <div className="mt-3 text-center">
                  <p className={`text-sm font-semibold ${colors.text}`}>
                    <span className="hidden sm:inline">{phase.label}</span>
                    <span className="sm:hidden">{phase.shortLabel}</span>
                  </p>
                  <p className="text-xs text-text-tertiary mt-1">
                    {formatDate(phase.start)} - {formatDate(phase.end)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
