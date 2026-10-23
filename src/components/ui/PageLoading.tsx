import { cn } from '@/lib/utils/cn';

/** One grey placeholder block. */
export function Bone({ className }: { className?: string }) {
  return <span aria-hidden className={cn('block animate-shimmer rounded-lg bg-white/[0.06]', className)} />;
}

interface PageLoadingProps {
  /** Card on the right of the band. */
  aside?: boolean;
  /** Row of number tiles under the band title. */
  facts?: number;
  narrow?: boolean;
  /** Shape of the page body. */
  body?: 'grid' | 'split' | 'list' | 'none';
}

/**
 * Loading state that mirrors the real page frame: navy band (same paddings as
 * PageBand) and a body inside the same shell, so nothing jumps when data lands.
 */
export function PageLoading({ aside, facts = 0, narrow, body = 'grid' }: PageLoadingProps) {
  const shell = narrow ? 'shell-narrow' : 'shell';
  return (
    <div role="status" aria-label="Loading">
      <section className="band">
        <div className={cn(shell, 'pb-10 pt-10 sm:pb-12 sm:pt-12 lg:pt-14')}>
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-16">
            <div className="flex min-w-0 flex-1 flex-col gap-4">
              <Bone className="h-4 w-28 bg-white/10" />
              <Bone className="h-10 w-4/5 bg-white/10 sm:h-12" />
              <Bone className="h-5 w-3/5 bg-white/10" />
            </div>
            {aside && <Bone className="h-40 w-full rounded-2xl bg-white/10 lg:w-[420px] lg:shrink-0" />}
          </div>
          {facts > 0 && (
            <div className="mt-9 grid grid-cols-2 gap-2.5 sm:mt-10 sm:grid-cols-[repeat(auto-fit,minmax(170px,1fr))] sm:gap-3">
              {Array.from({ length: facts }).map((_, i) => (
                <Bone key={i} className="h-[88px] rounded-xl bg-white/10" />
              ))}
            </div>
          )}
        </div>
      </section>

      {body !== 'none' && (
        <div className={cn(shell, 'pb-24 pt-12 sm:pt-14')}>
          <Bone className="mb-5 h-7 w-48" />
          {body === 'grid' && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Bone key={i} className="h-48 rounded-[18px]" />
              ))}
            </div>
          )}
          {body === 'split' && (
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-10">
              <Bone className="h-[420px] min-w-0 flex-1 rounded-[18px]" />
              <div className="flex w-full flex-col gap-4 lg:w-[340px] lg:shrink-0">
                <Bone className="h-40 rounded-[18px]" />
                <Bone className="h-32 rounded-[18px]" />
              </div>
            </div>
          )}
          {body === 'list' && (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Bone key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          )}
        </div>
      )}
      <span className="sr-only">Loading…</span>
    </div>
  );
}
