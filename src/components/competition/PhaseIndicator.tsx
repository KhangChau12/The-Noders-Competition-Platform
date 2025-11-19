'use client';

import React from 'react';
import { Badge } from '../ui/Badge';

interface PhaseIndicatorProps {
  currentPhase: 'upcoming' | 'registration' | 'public_test' | 'private_test' | 'ended';
  competitionType: '3-phase' | '4-phase';
  phases: {
    registration: { start: string; end: string };
    publicTest: { start: string; end: string };
    privateTest?: { start: string; end: string };
  };
  className?: string;
}

const PhaseIndicator: React.FC<PhaseIndicatorProps> = ({
  currentPhase,
  competitionType,
  phases,
  className = '',
}) => {
  const allPhases = competitionType === '3-phase'
    ? ['registration', 'public_test', 'ended']
    : ['registration', 'public_test', 'private_test', 'ended'];

  const phaseLabels: Record<string, string> = {
    upcoming: 'Upcoming',
    registration: 'Registration',
    public_test: 'Public Test',
    private_test: 'Private Test',
    ended: 'Ended',
  };

  const phaseVariants: Record<string, any> = {
    upcoming: 'secondary' as const,
    registration: 'registration' as const,
    public_test: 'public' as const,
    private_test: 'private' as const,
    ended: 'ended' as const,
  };

  const getPhaseStatus = (phase: string): 'completed' | 'active' | 'upcoming' => {
    const phaseOrder = ['registration', 'public_test', 'private_test', 'ended'];
    const currentIndex = phaseOrder.indexOf(currentPhase);
    const phaseIndex = phaseOrder.indexOf(phase);

    if (currentPhase === 'upcoming') return 'upcoming';
    if (phaseIndex < currentIndex) return 'completed';
    if (phaseIndex === currentIndex) return 'active';
    return 'upcoming';
  };

  return (
    <div className={`bg-bg-surface border border-border-default rounded-lg p-6 ${className}`}>
      {/* Current Phase Badge */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-text-tertiary uppercase tracking-wide mb-2">
          Current Phase
        </h3>
        <Badge variant={phaseVariants[currentPhase] || 'secondary'} className="text-base px-4 py-2">
          {phaseLabels[currentPhase] || 'Unknown'}
        </Badge>
      </div>

      {/* Phase Timeline */}
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border-default" />

        <div className="space-y-6">
          {allPhases.map((phase, index) => {
            const status = getPhaseStatus(phase);
            const isLast = index === allPhases.length - 1;

            return (
              <div key={phase} className="relative flex items-start gap-4">
                {/* Timeline Node */}
                <div
                  className={`
                    relative z-10 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all
                    ${
                      status === 'completed'
                        ? 'bg-primary-blue border-primary-blue'
                        : status === 'active'
                        ? 'bg-gradient-brand border-primary-blue shadow-lg shadow-primary-blue/30'
                        : 'bg-bg-surface border-border-default'
                    }
                  `}
                >
                  {status === 'completed' && (
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  {status === 'active' && (
                    <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
                  )}
                </div>

                {/* Phase Info */}
                <div className="flex-1 pb-6">
                  <h4
                    className={`font-semibold mb-1 ${
                      status === 'active'
                        ? 'text-primary-blue'
                        : status === 'completed'
                        ? 'text-text-primary'
                        : 'text-text-tertiary'
                    }`}
                  >
                    {phaseLabels[phase]}
                  </h4>
                  {phase !== 'ended' && (
                    <p className="text-sm text-text-tertiary">
                      {phase === 'registration' && (
                        <>
                          {new Date(phases.registration.start).toLocaleDateString()} -{' '}
                          {new Date(phases.registration.end).toLocaleDateString()}
                        </>
                      )}
                      {phase === 'public_test' && (
                        <>
                          {new Date(phases.publicTest.start).toLocaleDateString()} -{' '}
                          {new Date(phases.publicTest.end).toLocaleDateString()}
                        </>
                      )}
                      {phase === 'private_test' && phases.privateTest && (
                        <>
                          {new Date(phases.privateTest.start).toLocaleDateString()} -{' '}
                          {new Date(phases.privateTest.end).toLocaleDateString()}
                        </>
                      )}
                    </p>
                  )}
                  {status === 'active' && (
                    <Badge variant="secondary" className="mt-2">
                      In Progress
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PhaseIndicator;
