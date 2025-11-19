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

  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(calculateTimeRemaining());

  useEffect(() => {
    const timer = setInterval(() => {
      const newTime = calculateTimeRemaining();
      setTimeRemaining(newTime);

      if (newTime.isExpired && onComplete) {
        onComplete();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, onComplete]);

  const formatNumber = (num: number): string => {
    return num.toString().padStart(2, '0');
  };

  if (timeRemaining.isExpired) {
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

  const timeUnits = [
    { value: timeRemaining.days, label: 'Days' },
    { value: timeRemaining.hours, label: 'Hours' },
    { value: timeRemaining.minutes, label: 'Minutes' },
    { value: timeRemaining.seconds, label: 'Seconds' },
  ];

  return (
    <div className={`${className}`}>
      {label && (
        <h3 className="text-sm font-semibold text-text-tertiary uppercase tracking-wide text-center mb-4">
          {label}
        </h3>
      )}

      <div className="flex items-center justify-center gap-3 sm:gap-4">
        {timeUnits.map((unit, index) => (
          <React.Fragment key={unit.label}>
            <div className="flex flex-col items-center bg-bg-surface border border-border-default rounded-lg px-3 py-4 sm:px-6 min-w-[70px] sm:min-w-[90px]">
              <span className="text-3xl sm:text-4xl font-bold font-mono bg-gradient-brand bg-clip-text text-transparent leading-none">
                {formatNumber(unit.value)}
              </span>
              <span className="text-xs sm:text-sm text-text-tertiary uppercase tracking-wider mt-2">
                {unit.label}
              </span>
            </div>

            {index < timeUnits.length - 1 && (
              <span className="text-2xl sm:text-3xl font-bold text-text-tertiary">:</span>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Progress Bar (optional visual) */}
      <div className="mt-6">
        <div className="h-1 bg-bg-elevated rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-brand transition-all duration-1000 ease-linear"
            style={{
              width: `${Math.max(
                0,
                Math.min(
                  100,
                  ((timeRemaining.days * 24 * 60 * 60 +
                    timeRemaining.hours * 60 * 60 +
                    timeRemaining.minutes * 60 +
                    timeRemaining.seconds) /
                    (7 * 24 * 60 * 60)) *
                    100
                )
              )}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default CountdownTimer;
