'use client';

import { useState } from 'react';
import { FIELD_CLASS } from '@/components/ui/Input';
import { cn } from '@/lib/utils/cn';

export const field = cn(FIELD_CLASS, 'border-border-subtle');
export const area = cn(FIELD_CLASS, 'border-border-subtle h-auto py-3 leading-relaxed');

/** Numbered form section card. */
export function FormSection({ n, title, sub, children, tone }: { n: number; title: string; sub?: string; children: React.ReactNode; tone?: 'violet' | 'blue' | 'amber' | 'teal' }) {
  const numColor = tone === 'violet' ? 'text-violet' : tone === 'amber' ? 'text-amber' : tone === 'teal' ? 'text-teal' : 'text-blue';
  return (
    <section className="flex flex-col gap-5 rounded-[18px] bg-bg-surface p-5 sm:p-7">
      <header>
        <h2 className="h-card flex items-baseline gap-3">
          <span className={cn('font-mono text-base', numColor)}>{String(n).padStart(2, '0')}</span>
          {title}
        </h2>
        {sub && <p className="mt-1 text-[15px] text-text-tertiary">{sub}</p>}
      </header>
      {children}
    </section>
  );
}

/** Label + control + hint. */
export function Field({ label, htmlFor, hint, required, children, className }: { label: string; htmlFor?: string; hint?: React.ReactNode; required?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <label htmlFor={htmlFor} className="text-sm font-semibold">
        {label}
        {required && <span className="text-amber"> *</span>}
      </label>
      {children}
      {hint && <span className="text-sm text-text-muted">{hint}</span>}
    </div>
  );
}

/** Radio group shown as tappable cards. */
export function ChoiceCards<T extends string>({
  name,
  value,
  onChange,
  options,
  columns = 2,
}: {
  name: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; sub?: string }[];
  columns?: 2 | 3;
}) {
  return (
    <div role="radiogroup" className={cn('grid grid-cols-1 gap-2.5', columns === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2')}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <label key={o.value} className={cn('flex min-h-[56px] cursor-pointer flex-col justify-center gap-0.5 rounded-xl border px-4 py-3 transition-colors', on ? 'border-blue bg-blue-bg' : 'border-border-subtle hover:border-text-muted')}>
            <input type="radio" name={name} value={o.value} checked={on} onChange={() => onChange(o.value)} className="sr-only" />
            <span className="font-semibold">{o.label}</span>
            {o.sub && <span className="text-sm text-text-tertiary">{o.sub}</span>}
          </label>
        );
      })}
    </div>
  );
}

/**
 * Plain-text summary field with a soft length guide. Shown on cards and in the
 * page header, so it stays one or two sentences and carries no formatting.
 */
export function ShortTextField({ id, name, label, defaultValue, recommended = 220, hint }: { id: string; name: string; label: string; defaultValue: string; recommended?: number; hint: string }) {
  const [len, setLen] = useState(defaultValue.length);
  const over = len > recommended;
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-semibold">
          {label}
          <span className="text-amber"> *</span>
        </label>
        <span className={cn('font-mono text-xs', over ? 'text-amber' : 'text-text-muted')}>
          {len}/{recommended}
        </span>
      </span>
      <textarea id={id} name={name} defaultValue={defaultValue} required rows={3} onChange={(e) => setLen(e.target.value.length)} className={area} />
      <span className={cn('text-sm', over ? 'text-amber' : 'text-text-muted')}>{over ? 'Longer than recommended; it will be shortened on cards.' : hint}</span>
    </div>
  );
}

/** Error / success line at the bottom of a form. */
export function FormMessage({ error, ok }: { error?: string; ok?: string }) {
  if (!error && !ok) return null;
  return (
    <p role={error ? 'alert' : 'status'} className={cn('rounded-xl px-4 py-3 text-[15px]', error ? 'bg-amber-bg text-amber-soft' : 'bg-teal-bg text-teal-soft')}>
      {error || ok}
    </p>
  );
}

/** "YYYY-MM-DDTHH:mm" in Vietnam time for a datetime-local input. */
export function toVnInput(iso: string | null | undefined): string {
  if (!iso) return '';
  return new Date(new Date(iso).getTime() + 7 * 3600_000).toISOString().slice(0, 16);
}

/** Read a datetime-local value as Vietnam time and return a full ISO string. */
export function fromVnInput(v: string): string {
  if (!v) return '';
  const d = new Date(`${v}:00+07:00`);
  return isNaN(d.getTime()) ? '' : d.toISOString();
}
