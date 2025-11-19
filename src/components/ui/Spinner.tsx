'use client';

import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'white' | 'accent';
  className?: string;
}

const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
    xl: 'w-16 h-16 border-4',
  };

  const colorClasses = {
    primary: 'border-bg-elevated border-t-primary-blue',
    white: 'border-gray-700 border-t-white',
    accent: 'border-bg-elevated border-t-accent-cyan',
  };

  return (
    <div
      className={`${sizeClasses[size]} ${colorClasses[color]} ${className} rounded-full animate-spin`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

// Loading overlay component
export const SpinnerOverlay: React.FC<{
  message?: string;
}> = ({ message = 'Loading...' }) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
      <Spinner size="xl" color="primary" />
      {message && (
        <p className="mt-4 text-text-primary font-semibold">{message}</p>
      )}
    </div>
  );
};

// Inline loader for page sections
export const SpinnerInline: React.FC<{
  message?: string;
  className?: string;
}> = ({ message, className = '' }) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <Spinner size="lg" color="primary" />
      {message && (
        <p className="mt-4 text-text-secondary">{message}</p>
      )}
    </div>
  );
};

export default Spinner;
