import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

export interface Crumb {
  label: string;
  href?: string;
}

interface PageBandProps {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  crumbs?: Crumb[];
  /** Card on the right (stacks under the text on phones). */
  aside?: React.ReactNode;
  /** Full-width row under the title block (fact tiles, timeline…). */
  children?: React.ReactNode;
  /** Use the narrower 1080px frame (forms). */
  narrow?: boolean;
  className?: string;
}

/**
 * The navy band at the top of a page. Text left, optional card right; on
 * phones the card drops below the text and everything keeps the shell gutter.
 */
export function PageBand({ eyebrow, title, description, crumbs, aside, children, narrow, className }: PageBandProps) {
  return (
    <section className={cn('band', className)}>
      <div className={cn(narrow ? 'shell-narrow' : 'shell', 'pb-10 pt-10 sm:pb-12 sm:pt-12 lg:pt-14')}>
        {crumbs && crumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-6 text-sm text-navy-text sm:mb-7">
            <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
              {crumbs.map((c, i) => (
                <li key={i} className="flex items-center gap-2">
                  {i > 0 && <span aria-hidden className="opacity-60">/</span>}
                  {c.href ? (
                    <Link href={c.href} className="band-link">
                      {c.label}
                    </Link>
                  ) : (
                    <span aria-current="page">{c.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-16">
          <div className="min-w-0 flex-1">
            {eyebrow && <p className="eyebrow mb-3 sm:mb-4">{eyebrow}</p>}
            <h1 className="h-page text-balance">{title}</h1>
            {description && <div className="mt-4 max-w-[600px] text-base text-navy-text sm:text-lg">{description}</div>}
          </div>
          {aside && <div className="w-full min-w-0 lg:w-[420px] lg:shrink-0">{aside}</div>}
        </div>
        {children && <div className="mt-9 sm:mt-10">{children}</div>}
      </div>
    </section>
  );
}

export interface Fact {
  value: React.ReactNode;
  label: string;
  /** Tailwind text colour class for the number. */
  color?: string;
}

/** Number tiles that sit on the navy band. 2 columns on phones, auto-fit above. */
export function BandFacts({ facts, className }: { facts: Fact[]; className?: string }) {
  return (
    <dl className={cn('grid grid-cols-2 gap-2.5 sm:grid-cols-[repeat(auto-fit,minmax(170px,1fr))] sm:gap-3', className)}>
      {facts.map((f, i) => (
        <div key={i} className="band-tile flex flex-col-reverse gap-1.5">
          <dt className="text-[0.8125rem] leading-snug text-navy-text sm:text-sm">{f.label}</dt>
          <dd
            className={cn(
              'font-mono leading-none tabular',
              // Text values (dates, names) sit one step below numbers so they stay on one line.
              typeof f.value === 'string' && /[A-Za-z]/.test(f.value) && f.value.length > 8 ? 'text-lg leading-tight sm:text-xl' : 'text-2xl sm:text-[1.75rem]',
              f.color ?? 'text-white'
            )}
          >
            {f.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Section heading row: title left, optional link/action right; wraps on phones. */
export function SectionHead({
  title,
  sub,
  action,
  id,
  className,
}: {
  title: React.ReactNode;
  sub?: React.ReactNode;
  action?: React.ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <div className={cn('mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 sm:mb-6', className)}>
      <div className="min-w-0">
        <h2 id={id} className="h-section">
          {title}
        </h2>
        {sub && <p className="mt-1.5 text-text-tertiary">{sub}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
