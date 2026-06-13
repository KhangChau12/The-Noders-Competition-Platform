import Skeleton from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';
import {
  DashboardCompetitionRowSkeleton,
  PracticeProblemCardSkeleton,
} from '@/components/ui/PageSkeletons';

export default function DashboardLoading() {
  return (
    <div className="min-h-screen px-4 sm:px-6 py-8 sm:py-10">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-6 sm:mb-8 space-y-1.5 sm:space-y-2">
          <Skeleton variant="text" height="2.75rem" width="12rem" />
          <Skeleton variant="text" height="1rem" width="24rem" />
        </div>

        {/* Next deadline callout card */}
        <Card className="p-4 sm:p-5 mb-8 ring-1 ring-accent-cyan/20">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
            <div className="flex-1 min-w-0 space-y-1">
              <Skeleton variant="text" height="0.7rem" width="14rem" />
              <Skeleton variant="text" height="1.1rem" width="55%" />
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <Skeleton variant="text" height="1.75rem" width="8rem" />
              <Skeleton variant="circular" width="1.25rem" height="1.25rem" />
            </div>
          </div>
        </Card>

        {/* Quick stats: 2×2 on mobile, 4-up on lg */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-10">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i} className="relative overflow-hidden p-3.5 sm:p-5 space-y-1">
              <Skeleton variant="text" height="2rem" width="3.5rem" />
              <Skeleton variant="text" height="0.65rem" width="75%" />
            </Card>
          ))}
        </div>

        {/* 2-col layout */}
        <div className="grid lg:grid-cols-[1fr_380px] gap-6 lg:gap-8 items-start">

          {/* Left column */}
          <div className="space-y-8 sm:space-y-12">

            {/* Your competitions */}
            <section>
              <div className="flex items-center justify-between gap-3 mb-5">
                <Skeleton variant="text" height="1.6rem" width="13rem" />
                <Skeleton variant="text" height="0.85rem" width="6rem" />
              </div>
              <div className="space-y-4">
                {[0, 1, 2].map((i) => (
                  <DashboardCompetitionRowSkeleton key={i} />
                ))}
              </div>
            </section>

            {/* Open for registration */}
            <section>
              <Skeleton variant="text" height="1.6rem" width="16rem" className="mb-5" />
              <div className="space-y-3">
                {[0, 1].map((i) => (
                  <Card key={i} className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex gap-2">
                          <Skeleton height="1.4rem" width="7rem" className="rounded-full" />
                          <Skeleton height="1.4rem" width="5rem" className="rounded-full" />
                        </div>
                        <Skeleton variant="text" height="1rem" width="65%" />
                        <Skeleton variant="text" height="0.75rem" width="45%" />
                      </div>
                      <Skeleton height="2.25rem" width="8rem" className="shrink-0" />
                    </div>
                  </Card>
                ))}
              </div>
            </section>

            {/* Continue practicing */}
            <section>
              <div className="flex items-center justify-between gap-3 mb-5">
                <Skeleton variant="text" height="1.6rem" width="15rem" />
                <Skeleton variant="text" height="0.85rem" width="7rem" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {[0, 1, 2, 3].map((i) => (
                  <PracticeProblemCardSkeleton key={i} />
                ))}
              </div>
            </section>

          </div>

          {/* Right sidebar */}
          <aside className="space-y-6">

            {/* Teams */}
            <Card className="p-5 sm:p-6 space-y-4">
              <Skeleton variant="text" height="1.4rem" width="8rem" />
              <div className="space-y-3">
                {[0, 1].map((i) => (
                  <div key={i} className="flex items-center justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <Skeleton variant="text" height="1rem" width="60%" />
                      <Skeleton variant="text" height="0.75rem" width="40%" />
                    </div>
                    <Skeleton height="2rem" width="4rem" />
                  </div>
                ))}
              </div>
              <Skeleton height="2.25rem" width="100%" />
            </Card>

            {/* Recent activity */}
            <Card className="p-5 sm:p-6 space-y-4">
              <Skeleton variant="text" height="1.4rem" width="10rem" />
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="space-y-1 pb-2 border-b border-border-default/40 last:border-0">
                  <div className="flex justify-between gap-3">
                    <Skeleton variant="text" height="0.9rem" width="60%" />
                    <Skeleton variant="text" height="0.9rem" width="15%" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton variant="text" height="0.7rem" width="25%" />
                    <Skeleton variant="text" height="0.7rem" width="20%" />
                  </div>
                </div>
              ))}
            </Card>

          </aside>
        </div>

      </div>
    </div>
  );
}
