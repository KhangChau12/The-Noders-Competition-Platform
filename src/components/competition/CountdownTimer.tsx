'use client';

import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  targetDate: string | Date;
  label?: string;
  onComplete?: () => void;
  className?: string;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

const TIME_UNITS = ['Days', 'Hours', 'Minutes', 'Seconds'] as const;

const CountdownTimer: React.FC<CountdownTimerProps> = ({
  targetDate,
  label = 'Time Remaining',
  onComplete,
  className = '',
}) => {
  const calculateTimeRemaining = (): TimeRemaining => {
    const target = new Date(targetDate).getTime();
    const now = new Date().getTime();
    const difference = target - now;

    if (difference <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isExpired: true,
      };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((difference % (1000 * 60)) / 1000),
      isExpired: false,
    };
  };

  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setTimeRemaining(calculateTimeRemaining());

    const timer = setInterval(() => {
      const newTime = calculateTimeRemaining();
      setTimeRemaining(newTime);

      if (newTime.isExpired && onComplete) {
        onComplete();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onComplete]);

  if (timeRemaining.isExpired && isMounted) {
    return (
      <div className={`text-center ${className}`}>
        <div className="inline-block px-6 py-3 bg-bg-surface border border-border-default rounded-lg">
          <p className="text-lg font-semibold text-text-tertiary">
            {label} Expired
          </p>
        </div>
      </div>
    );
  }

  const formatNumber = (num: number): string => num.toString().padStart(2, '0');

  // Render "--" until mounted to avoid hydration mismatch
  const values = isMounted
    ? [timeRemaining.days, timeRemaining.hours, timeRemaining.minutes, timeRemaining.seconds].map(formatNumber)
    : ['--', '--', '--', '--'];

  return (
    <div className={className}>
      {label && (
        <h3 className="text-xs sm:text-sm font-semibold text-text-tertiary uppercase tracking-widest text-center mb-4">
          {label}
        </h3>
      )}

      <div className="grid grid-cols-4 gap-2 sm:gap-3 max-w-md mx-auto">
        {TIME_UNITS.map((unit, index) => (
          <div
            key={unit}
            className="flex flex-col items-center bg-bg-surface border border-border-default rounded-lg px-1 py-3 sm:px-3 sm:py-4 min-w-0"
          >
            <span className="text-2xl sm:text-3xl md:text-4xl font-bold font-mono bg-gradient-brand bg-clip-text text-transparent leading-none tabular-nums">
              {values[index]}
            </span>
            <span className="text-[10px] sm:text-xs text-text-tertiary uppercase tracking-wider mt-2">
              {unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CountdownTimer;
