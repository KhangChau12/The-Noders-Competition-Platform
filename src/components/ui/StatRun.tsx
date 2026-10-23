import { cn } from '@/lib/utils/cn';

export type StatTone = 'default' | 'blue' | 'cyan' | 'warn' | 'violet' | 'teal' | 'amber';

export interface StatItem {
  label: string;
  /** The value — a string, or a node when it needs a trailing unit span. */
  value: React.ReactNode;
  tone?: StatTone;
}

interface StatRunProps {
  items: StatItem[];
  size?: 'default' | 'sm';
  /** `tiles` puts each stat in a small rounded tile (use on tinted cards). */
  layout?: 'run' | 'tiles';
  className?: string;
}

const TONE_CLASS: Record<StatTone, string> = {
  default: 'text-text-primary',
  blue: 'text-blue',
  cyan: 'text-teal',
  teal: 'text-teal',
  warn: 'text-amber',
  amber: 'text-amber',
  violet: 'text-violet',
};

/** A row of numbers with a small label under each. */
export function StatRun({ items, size = 'default', layout = 'run', className }: StatRunProps) {
  if (layout === 'tiles') {
    return (
      <dl className={cn('grid grid-cols-2 gap-2 sm:grid-cols-[repeat(auto-fit,minmax(130px,1fr))]', className)}>
        {items.map((item, i) => (
          <div key={i} className="flex flex-col-reverse gap-0.5 rounded-xl bg-black/25 px-4 py-3">
            <dt className="text-[13px] text-text-muted">{item.label}</dt>
            <dd className={cn('font-mono text-lg leading-tight tabular', TONE_CLASS[item.tone ?? 'default'])}>{item.value}</dd>
          </div>
        ))}
      </dl>
    );
  }

  return (
    <dl className={cn('flex flex-wrap items-end', size === 'sm' ? 'gap-x-7 gap-y-4' : 'gap-x-9 gap-y-5', className)}>
      {items.map((item, i) => (
        <div key={i} className="flex flex-col-reverse gap-1">
          <dt className="text-[0.8125rem] text-text-muted">{item.label}</dt>
          <dd
            className={cn(
              'font-mono leading-none tabular',
              size === 'sm' ? 'text-base' : 'text-[1.375rem]',
              TONE_CLASS[item.tone ?? 'default']
            )}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
