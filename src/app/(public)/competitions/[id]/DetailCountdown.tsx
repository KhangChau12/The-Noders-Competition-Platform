'use client';

import { useEffect, useState } from 'react';

interface Props {
  /** ISO string of the deadline. */
  target: string;
}

function parts(target: string) {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    d: Math.floor(diff / 86_400_000),
    h: Math.floor((diff % 86_400_000) / 3_600_000),
    m: Math.floor((diff % 3_600_000) / 60_000),
    s: Math.floor((diff % 60_000) / 1000),
  };
}

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * The demoted competition-detail countdown: one mono string DD:HH:MM:SS with a
 * micro caption. Renders "--:--:--:--" until mounted to avoid hydration drift.
 */
export default function DetailCountdown({ target }: Props) {
  const [p, setP] = useState<ReturnType<typeof parts>>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setP(parts(target));
    const t = setInterval(() => setP(parts(target)), 1000);
    return () => clearInterval(t);
  }, [target]);

  const text =
    mounted && p
      ? `${pad(p.d)}:${pad(p.h)}:${pad(p.m)}:${pad(p.s)}`
      : '--:--:--:--';

  return (
    <div>
      <div className="font-mono font-bold text-sm text-[#60A5FA] tabular-nums">{text}</div>
      <div className="font-mono text-[0.6875rem] text-text-disabled tracking-[0.14em]">
        DD HH MM SS
      </div>
    </div>
  );
}
