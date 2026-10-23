import { cn } from '@/lib/utils/cn';

interface AuthCardProps {
  eyebrow?: string;
  title: React.ReactNode;
  sub?: React.ReactNode;
  children: React.ReactNode;
  /** Small row under the card: links, context. */
  strip?: React.ReactNode;
  className?: string;
}

/**
 * Centred card used by every sign-in screen. Navy head inside the card,
 * form on the dark surface below. Same 460px column on phone and desktop;
 * on phones it simply fills the shell gutter.
 */
export function AuthCard({ eyebrow, title, sub, children, strip, className }: AuthCardProps) {
  return (
    <div className="shell flex justify-center pb-20 pt-10 sm:pb-24 sm:pt-16">
      <div className={cn('flex w-full max-w-[460px] flex-col gap-5', className)}>
        <div className="overflow-hidden rounded-[20px] bg-bg-surface shadow-lift">
          <div className="band px-6 pb-6 pt-7 sm:px-8 sm:pt-8">
            {eyebrow && <p className="eyebrow mb-2.5">{eyebrow}</p>}
            <h1 className="text-[1.75rem] font-bold leading-tight tracking-[-0.02em] sm:text-[2rem]">{title}</h1>
            {sub && <div className="mt-2 text-[15px] text-navy-text">{sub}</div>}
          </div>
          <div className="px-6 py-6 sm:px-8 sm:py-7">{children}</div>
        </div>
        {strip && <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 px-2 text-center text-sm text-text-tertiary">{strip}</div>}
      </div>
    </div>
  );
}

/** Coloured notice inside an auth card. */
export function AuthNotice({ tone, children }: { tone: 'info' | 'error'; children: React.ReactNode }) {
  return (
    <p role={tone === 'error' ? 'alert' : 'status'} className={cn('rounded-xl px-4 py-3 text-[15px]', tone === 'error' ? 'bg-amber-bg text-amber-soft' : 'bg-teal-bg text-teal-soft')}>
      {children}
    </p>
  );
}
