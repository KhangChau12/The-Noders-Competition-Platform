'use client';

import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  count?: number;
}

const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width = '100%',
  height = '1rem',
  count = 1,
}) => {
  const baseClasses = 'bg-gradient-to-r from-bg-surface via-bg-elevated to-bg-surface bg-[length:200%_100%] animate-shimmer';

  const variantClasses = {
    text: 'rounded-md',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  const skeletons = Array.from({ length: count }, (_, index) => (
    <div
      key={index}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  ));

  return <>{skeletons}</>;
};

// Skeleton Card Component
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`bg-bg-surface border border-border-default rounded-lg p-6 ${className}`}>
      <Skeleton variant="rectangular" height="12rem" className="mb-4" />
      <Skeleton variant="text" height="1.5rem" width="70%" className="mb-2" />
      <Skeleton variant="text" height="1rem" width="100%" className="mb-2" />
      <Skeleton variant="text" height="1rem" width="90%" className="mb-4" />
      <div className="flex gap-2">
        <Skeleton variant="rectangular" height="2.5rem" width="6rem" />
        <Skeleton variant="rectangular" height="2.5rem" width="6rem" />
      </div>
    </div>
  );
};

// Skeleton Table Row
export const SkeletonTableRow: React.FC<{
  columns: number;
  className?: string;
}> = ({ columns, className = '' }) => {
  return (
    <tr className={className}>
      {Array.from({ length: columns }, (_, index) => (
        <td key={index} className="px-4 py-4">
          <Skeleton variant="text" height="1rem" />
        </td>
      ))}
    </tr>
  );
};

// Skeleton Table
export const SkeletonTable: React.FC<{
  rows?: number;
  columns?: number;
  className?: string;
}> = ({ rows = 5, columns = 4, className = '' }) => {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-bg-surface border-b border-border-default">
            {Array.from({ length: columns }, (_, index) => (
              <th key={index} className="px-4 py-4">
                <Skeleton variant="text" height="1rem" width="80%" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, index) => (
            <SkeletonTableRow key={index} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Skeleton List
export const SkeletonList: React.FC<{
  items?: number;
  className?: string;
}> = ({ items = 3, className = '' }) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {Array.from({ length: items }, (_, index) => (
        <div key={index} className="flex items-center gap-4">
          <Skeleton variant="circular" width="3rem" height="3rem" />
          <div className="flex-1">
            <Skeleton variant="text" height="1rem" width="60%" className="mb-2" />
            <Skeleton variant="text" height="0.875rem" width="40%" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default Skeleton;
