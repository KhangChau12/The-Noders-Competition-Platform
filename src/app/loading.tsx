import Skeleton from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';
import { StatCardsSkeleton, CompetitionCardSkeleton } from '@/components/ui/PageSkeletons';

export default function HomeLoading() {
  return (
    <main className="min-h-screen">

      {/* ── Hero ── */}
      <section className="relative lg:min-h-[90vh] flex items-center overflow-hidden py-16 sm:py-20 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-10 lg:gap-8 items-center">
          {/* Left: text + CTA */}
          <div className="text-center lg:text-left mx-auto lg:mx-0 max-w-2xl space-y-5">
            {/* Two-line heading */}
            <div className="space-y-2">
              <Skeleton variant="text" height="3rem" width="55%" className="mx-auto lg:mx-0" />
              <Skeleton variant="text" height="3.25rem" width="90%" className="mx-auto lg:mx-0" />
            </div>
            {/* Subtitle */}
            <Skeleton variant="text" height="1.1rem" width="90%" className="mx-auto lg:mx-0" />
            <Skeleton variant="text" height="1.1rem" width="72%" className="mx-auto lg:mx-0" />
            {/* Value props */}
            <div className="flex items-center justify-center lg:justify-start gap-3">
              <Skeleton variant="text" height="0.9rem" width="12rem" />
              <Skeleton variant="text" height="0.9rem" width="12rem" />
            </div>
            {/* CTA buttons */}
            <div className="flex gap-3 justify-center lg:justify-start">
              <Skeleton height="2.75rem" width="11rem" />
              <Skeleton height="2.75rem" width="9rem" />
            </div>
          </div>

          {/* Right: floating cards constellation (desktop only) */}
          <div className="relative h-[400px] lg:h-[500px] w-full hidden lg:block rounded-xl bg-bg-surface/40 border border-border-default animate-pulse" />
        </div>
      </section>

      {/* ── Platform Stats ── */}
      <section className="px-4 sm:px-6 py-12 sm:py-16 bg-bg-surface/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 sm:mb-12 space-y-2">
            <Skeleton variant="text" height="0.7rem" width="8rem" className="mx-auto" />
            <Skeleton variant="text" height="2.25rem" width="14rem" className="mx-auto" />
            <Skeleton variant="text" height="1rem" width="22rem" className="mx-auto" />
          </div>
          <StatCardsSkeleton count={4} />
        </div>
      </section>

      {/* ── Competition preview ── */}
      <section className="px-4 sm:px-6 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <Skeleton variant="text" height="0.7rem" width="10rem" className="mx-auto" />
            <Skeleton variant="text" height="2rem" width="16rem" className="mx-auto" />
            <Skeleton variant="text" height="1rem" width="22rem" className="mx-auto" />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <CompetitionCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>

    </main>
  );
}
