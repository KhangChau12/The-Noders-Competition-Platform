'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils/cn';

interface SegmentedProps {
  options: { id: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  /** Background of the moving pill. */
  pillClass?: string;
  className?: string;
}

/** Toggle group whose highlight slides to the chosen option. */
export default function Segmented({ options, value, onChange, pillClass = 'bg-blue-strong', className }: SegmentedProps) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    const measure = () => {
      const el = refs.current[value];
      if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [value, options]);

  return (
    <div role="group" className={cn('relative inline-flex rounded-lg bg-bg-surface p-1', className)}>
      <span
        aria-hidden
        className={cn('absolute bottom-1 top-1 left-0 rounded-md transition-[transform,width] duration-300 ease-out', pillClass, !pill && 'opacity-0')}
        style={{ width: pill?.width ?? 0, transform: `translateX(${pill?.left ?? 0}px)` }}
      />
      {options.map((o) => (
        <button
          key={o.id}
          ref={(el) => {
            refs.current[o.id] = el;
          }}
          type="button"
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
          className={cn('relative min-h-[36px] rounded-md px-3.5 text-sm font-semibold transition-colors duration-200', value === o.id ? 'text-white' : 'text-text-tertiary hover:text-text-primary')}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
