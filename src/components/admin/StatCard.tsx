import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface StatCardProps {
  Icon: LucideIcon;
  value: number | string;
  label: string;
  sub?: string;
  /** Tailwind text color class for the decorative icon, e.g. 'text-primary-blue/15' */
  accent?: string;
  /** Render the whole card as a subtle highlight (e.g. for "needs attention" metrics) */
  highlight?: boolean;
}

/**
 * Compact KPI card for admin pages. Unlike the generic `Card`, it does not lift
 * on hover (these are read-only metrics, not interactive targets) and the
 * decorative icon is sized down so the number stays the focal point.
 */
export function StatCard({ Icon, value, label, sub, accent = 'text-primary-blue/15', highlight }: StatCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border bg-bg-surface p-4 sm:p-5',
        highlight ? 'border-warning/40 bg-warning/5' : 'border-border-default'
      )}
    >
      <Icon
        className={cn(
          'absolute -bottom-2 -right-2 h-12 w-12 rotate-[-8deg] pointer-events-none',
          highlight ? 'text-warning/20' : accent
        )}
      />
      <p
        className={cn(
          'relative text-2xl sm:text-3xl font-bold font-mono leading-none mb-1.5',
          highlight ? 'text-warning' : 'text-text-primary'
        )}
      >
        {value}
      </p>
      <p className="relative text-xs font-semibold uppercase tracking-wider text-text-tertiary">{label}</p>
      {sub && <p className="relative text-[11px] text-text-tertiary mt-0.5">{sub}</p>}
    </div>
  );
}
