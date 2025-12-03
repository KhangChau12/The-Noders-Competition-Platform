'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Users, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { getCompetitionRegistrations } from './actions';

interface Registration {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  registered_at: string;
  user: {
    id: string;
    full_name: string;
    email: string;
  };
}

interface CompetitionRegistrationsListProps {
  competitionId: string;
  competitionTitle: string;
  phase: string;
  phaseColor: string;
  endDate: Date;
}

export default function CompetitionRegistrationsList({
  competitionId,
  competitionTitle,
  phase,
  phaseColor,
  endDate,
}: CompetitionRegistrationsListProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const handleToggle = async () => {
    if (!isExpanded && !hasLoaded) {
      // First time expanding - fetch data
      setIsLoading(true);
      const { registrations: data } = await getCompetitionRegistrations(competitionId);
      setRegistrations(data as Registration[]);
      setHasLoaded(true);
      setIsLoading(false);
    }
    setIsExpanded(!isExpanded);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'green';
      case 'rejected':
        return 'red';
      case 'pending':
        return 'yellow';
      default:
        return 'secondary';
    }
  };

  const statusCounts = {
    pending: registrations.filter((r) => r.status === 'pending').length,
    approved: registrations.filter((r) => r.status === 'approved').length,
    rejected: registrations.filter((r) => r.status === 'rejected').length,
  };

  return (
    <div className="border border-border-default rounded-lg overflow-hidden bg-bg-surface">
      {/* Competition Header - Clickable */}
      <button
        onClick={handleToggle}
        className="w-full p-3 hover:bg-bg-elevated/50 transition-colors"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-text-tertiary flex-shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-text-tertiary flex-shrink-0" />
            )}
            <div className="font-medium text-sm text-left flex-1">{competitionTitle}</div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={
                phase === 'registration'
                  ? 'yellow'
                  : phase === 'public test'
                  ? 'blue'
                  : phase === 'private test'
                  ? 'purple'
                  : phase === 'upcoming'
                  ? 'secondary'
                  : 'outline'
              }
              className="text-xs flex-shrink-0"
            >
              {phase}
            </Badge>
          </div>
        </div>
        <div className="text-xs text-text-tertiary mt-1 text-left ml-6">
          {phase === 'ended' ? 'Ended' : `Ends: ${endDate.toLocaleDateString()}`}
        </div>
      </button>

      {/* Registrations List - Expandable */}
      {isExpanded && (
        <div className="border-t border-border-default">
          {isLoading ? (
            <div className="p-4 flex items-center justify-center gap-2 text-text-tertiary">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading registrations...</span>
            </div>
          ) : registrations.length > 0 ? (
            <>
              {/* Summary */}
              <div className="px-4 py-2 bg-bg-elevated/50 border-b border-border-default">
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span className="font-medium">{registrations.length}</span> total
                  </span>
                  {statusCounts.pending > 0 && (
                    <span className="text-warning">
                      {statusCounts.pending} pending
                    </span>
                  )}
                  {statusCounts.approved > 0 && (
                    <span className="text-success">
                      {statusCounts.approved} approved
                    </span>
                  )}
                  {statusCounts.rejected > 0 && (
                    <span className="text-error">
                      {statusCounts.rejected} rejected
                    </span>
                  )}
                </div>
              </div>

              {/* Registrations List */}
              <div className="max-h-60 overflow-y-auto">
                {registrations.map((registration) => (
                  <div
                    key={registration.id}
                    className="px-4 py-2 hover:bg-bg-elevated/30 border-b border-border-default last:border-0 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {registration.user.full_name}
                        </div>
                        <div className="text-xs text-text-tertiary truncate">
                          {registration.user.email}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge
                          variant={getStatusBadgeVariant(registration.status)}
                          className="text-xs"
                        >
                          {registration.status}
                        </Badge>
                        <span className="text-xs text-text-tertiary">
                          {new Date(registration.registered_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="p-4 text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-text-tertiary opacity-50" />
              <p className="text-sm text-text-tertiary">No registrations yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
