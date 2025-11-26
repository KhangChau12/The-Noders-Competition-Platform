import React from 'react';
import { Button } from './Button';
import Link from 'next/link';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  secondaryActionLabel,
  secondaryActionHref,
  onSecondaryAction,
  className = '',
}) => {
  const defaultIcon = (
    <svg
      className="w-16 h-16 text-text-tertiary"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  );

  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}>
      <div className="mb-6">{icon || defaultIcon}</div>
      <h3 className="text-2xl font-bold text-text-primary mb-2">{title}</h3>
      {description && (
        <p className="text-text-secondary max-w-md mb-8">{description}</p>
      )}
      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {actionLabel && (
            <>
              {actionHref ? (
                <Link href={actionHref}>
                  <Button variant="primary">{actionLabel}</Button>
                </Link>
              ) : (
                <Button variant="primary" onClick={onAction}>
                  {actionLabel}
                </Button>
              )}
            </>
          )}
          {secondaryActionLabel && (
            <>
              {secondaryActionHref ? (
                <Link href={secondaryActionHref}>
                  <Button variant="outline">{secondaryActionLabel}</Button>
                </Link>
              ) : (
                <Button variant="outline" onClick={onSecondaryAction}>
                  {secondaryActionLabel}
                </Button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

// Preset variants for common empty states
export const EmptyCompetitions: React.FC<{ showAction?: boolean }> = ({ showAction = true }) => (
  <EmptyState
    icon={
      <svg
        className="w-16 h-16 text-text-tertiary"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
    }
    title="No Competitions Found"
    description="There are no competitions at the moment. Check back later or create a new competition."
    actionLabel={showAction ? 'Create Competition' : undefined}
    actionHref={showAction ? '/admin/competitions/create' : undefined}
  />
);

export const EmptySubmissions: React.FC = () => (
  <EmptyState
    icon={
      <svg
        className="w-16 h-16 text-text-tertiary"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
        />
      </svg>
    }
    title="No Submissions Yet"
    description="You haven't submitted for this competition yet. Upload your CSV file to get started."
  />
);

export const EmptyTeams: React.FC = () => (
  <EmptyState
    icon={
      <svg
        className="w-16 h-16 text-text-tertiary"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    }
    title="No Teams Yet"
    description="You haven't joined any teams. Create a new team or join an existing one."
    actionLabel="Create Team"
    actionHref="/teams/create"
    secondaryActionLabel="Find Teams"
    secondaryActionHref="/teams"
  />
);

export const EmptyLeaderboard: React.FC = () => (
  <EmptyState
    icon={
      <svg
        className="w-16 h-16 text-text-tertiary"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    }
    title="Leaderboard Empty"
    description="No one has submitted for this competition yet. Be the first!"
  />
);

export const EmptyNotifications: React.FC = () => (
  <EmptyState
    icon={
      <svg
        className="w-16 h-16 text-text-tertiary"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
    }
    title="No Notifications"
    description="You're all caught up. No new notifications."
  />
);
