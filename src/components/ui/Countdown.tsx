'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils/cn';

function left(target: string) {
  const ms = new Date(target).getTime() - Date.now();
  if (ms <= 0) return null;
  return {
    d: Math.floor(ms / 86_400_000),
    h: Math.floor((ms % 86_400_000) / 3_600_000),
    m: Math.floor((ms % 3_600_000) / 60_000),
    s: Math.floor((ms % 60_000) / 1000),
  };
}

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Live countdown "05d 08h 41m" (or "08h 41m 12s" under a day). Renders the
 * server-computed text first, then ticks once mounted (no hydration drift).
 */
export function Countdown({ target, initial, className, unitClassName = 'text-current opacity-55' }: { target: string; initial?: string; className?: string; unitClassName?: string }) {
  const [p, setP] = useState<ReturnType<typeof left> | undefined>(undefined);

  useEffect(() => {
    setP(left(target));
    const t = setInterval(() => setP(left(target)), 1000);
    return () => clearInterval(t);
  }, [target]);

  if (p === undefined) return <span className={cn('font-mono tabular', className)}>{initial ?? '··'}</span>;
  if (p === null) return <span className={cn('font-mono tabular', className)}>now</span>;

  const segs = p.d > 0 ? [[p.d, 'd'], [p.h, 'h'], [p.m, 'm']] : [[p.h, 'h'], [p.m, 'm'], [p.s, 's']];
  return (
    <span className={cn('font-mono tabular', className)}>
      {segs.map(([v, u], i) => (
        <span key={u as string}>
          {i > 0 && ' '}
          {pad(v as number)}
          <span className={unitClassName}>{u}</span>
        </span>
      ))}
    </span>
  );
}
