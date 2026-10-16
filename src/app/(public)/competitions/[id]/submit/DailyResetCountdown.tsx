'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { getVietnamNextResetTime } from '@/lib/utils/timezone';

export default function DailyResetCountdown() {
  const [timeUntilReset, setTimeUntilReset] = useState('');

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const nextReset = getVietnamNextResetTime(now);

      const diff = Math.max(0, nextReset.getTime() - now.getTime());
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeUntilReset(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-1 text-xs text-text-tertiary mt-2">
      <Clock className="w-3 h-3" />
      <span>Resets in {timeUntilReset}</span>
    </div>
  );
}
