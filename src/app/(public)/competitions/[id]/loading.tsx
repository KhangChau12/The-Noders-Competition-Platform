import Skeleton from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';

export default function CompetitionDetailLoading() {
  return (
    <div className="min-h-screen">

      {/* ── Hero header ── */}
      <div className="px-4 sm:px-6 pt-8 pb-6 sm:pt-10 sm:pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Phase badge + meta */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Skeleton height="1.5rem" width="9rem" className="rounded-full" />
            <Skeleton variant="text" height="0.75rem" width="10rem" />
          </div>

          {/* Title */}
          <Skeleton variant="text" height="3rem" width="70%" className="mb-3" />

          {/* Description */}
          <Skeleton variant="text" height="1rem" width="100%" className="mb-1.5" />
          <Skeleton variant="text" height="1rem" width="75%" className="mb-5" />

          {/* Quick stats row */}
          <div className="flex items-center gap-4 sm:gap-6 pb-1">
            <Skeleton variant="text" height="0.9rem" width="7rem" />
            <Skeleton variant="text" height="0.9rem" width="7rem" />
            <Skeleton variant="text" height="0.9rem" width="8rem" />
          </div>
        </div>
      </div>

      {/* ── Main body ── */}
      <div className="px-4 sm:px-6 pb-12">
        <div className="max-w-7xl mx-auto">

          {/* Mobile action strip placeholder */}
          <div className="lg:hidden mb-5 flex gap-2">
            <Skeleton height="2.25rem" className="flex-1" />
            <Skeleton height="2.25rem" className="flex-1" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── Left / main (2 cols on lg) ── */}
            <div className="lg:col-span-2 space-y-5">

              {/* Countdown + timeline card */}
              <Card className="p-4 sm:p-6 overflow-hidden">
                {/* Countdown label */}
                <Skeleton variant="text" height="0.75rem" width="12rem" className="mb-3" />
                {/* Countdown digits */}
                <div className="flex gap-4 mb-5">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="space-y-1">
                      <Skeleton height="2.5rem" width="3.5rem" />
                      <Skeleton variant="text" height="0.65rem" width="3.5rem" />
                    </div>
                  ))}
                </div>
                {/* HorizontalTimeline */}
                <div className="pt-4 border-t border-border-default">
                  <div className="flex items-start justify-between gap-2">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="flex-1 flex flex-col items-center space-y-2">
                        <Skeleton variant="circular" width="2.5rem" height="2.5rem" />
                        <Skeleton variant="text" height="0.7rem" width="80%" className="mx-auto" />
                        <Skeleton variant="text" height="0.6rem" width="60%" className="mx-auto" />
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Tab navigation */}
              <div className="flex border-b border-border-default overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
                {['Overview', 'Leaderboard', 'My Submissions'].map((label) => (
                  <Skeleton
                    key={label}
                    height="2.75rem"
                    width="7rem"
                    className="shrink-0 mr-1"
                  />
                ))}
              </div>

              {/* Tab content — overview skeleton */}
              <Card className="p-4 sm:p-6 space-y-3">
                <Skeleton variant="text" height="1.4rem" width="50%" />
                <Skeleton variant="text" height="1rem" width="100%" />
                <Skeleton variant="text" height="1rem" width="95%" />
                <Skeleton variant="text" height="1rem" width="88%" />
                <Skeleton variant="text" height="1rem" width="100%" />
                <Skeleton variant="text" height="1rem" width="72%" />
              </Card>
            </div>

            {/* ── Sidebar (1 col on lg) ── */}
            <div className="space-y-5">

              {/* Your Status card */}
              <Card className="p-4 sm:p-5 space-y-4">
                <Skeleton variant="text" height="0.7rem" width="7rem" />
                <div className="rounded-xl bg-bg-elevated p-3 space-y-1.5">
                  <Skeleton variant="text" height="0.9rem" width="60%" />
                  <Skeleton variant="text" height="0.75rem" width="45%" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-bg-elevated rounded-xl border border-border-default space-y-1.5">
                    <Skeleton variant="text" height="0.7rem" width="3rem" />
                    <Skeleton variant="text" height="1.5rem" width="4rem" />
                  </div>
                  <div className="p-3 bg-bg-elevated rounded-xl border border-border-default space-y-1.5">
                    <Skeleton variant="text" height="0.7rem" width="3rem" />
                    <Skeleton variant="text" height="1.5rem" width="4rem" />
                  </div>
                </div>
              </Card>

              {/* Submission limits card */}
              <Card className="p-4 sm:p-5 space-y-4">
                <Skeleton variant="text" height="0.7rem" width="10rem" />
                <div className="space-y-2.5">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between gap-2">
                      <Skeleton variant="text" height="0.85rem" width="50%" />
                      <Skeleton variant="text" height="0.85rem" width="30%" />
                    </div>
                  ))}
                </div>
              </Card>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
