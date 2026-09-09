import { cn } from '@/lib/utils/cn';

export type StatTone = 'default' | 'blue' | 'cyan' | 'warn';

export interface StatItem {
  /** Uppercase label shown under the value (label role). */
  label: string;
  /** The value — a string, or a node when it needs a trailing unit span. */
  value: React.ReactNode;
  tone?: StatTone;
}

interface StatRunProps {
  items: StatItem[];
  /** `sm` drops only the number to text-[0.9375rem]; the label never changes size. */
  size?: 'default' | 'sm';
  className?: string;
}

const TONE_CLASS: Record<StatTone, string> = {
  default: 'text-text-primary',
  blue: 'text-[#60A5FA]',
  cyan: 'text-[#22D3EE]',
  warn: 'text-[#FBBF24]',
};

/**
 * A baseline-aligned row of numbers with a small label tucked under each.
 * Replaces the old boxed stat-tile grids — no border, no background;
 * the gap between items does the dividing.
 *
 * Trailing units go inside `value`:
 *   { label: 'Your quota', value: <>3<span className="text-xs font-normal text-text-disabled"> / 5 today</span></> }
 */
export function StatRun({ items, size = 'default', className }: StatRunProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-end',
        size === 'sm' ? 'gap-y-[18px] gap-x-7' : 'gap-y-6 gap-x-9',
        className
      )}
    >
      {items.map((item, i) => (
        <div key={i} className="flex flex-col-reverse gap-1">
          <span
            className={cn(
              'font-mono font-bold tabular-nums leading-none',
              size === 'sm' ? 'text-[0.9375rem]' : 'text-[1.375rem]',
              TONE_CLASS[item.tone ?? 'default']
            )}
          >
            {item.value}
          </span>
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-text-tertiary">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
