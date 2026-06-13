import Skeleton from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';

export default function PracticeDetailLoading() {
  return (
    <div className="min-h-screen">

      {/* ── Header area ── */}
      <div className="px-4 sm:px-6 pt-6 sm:pt-8 pb-5 sm:pb-6">
        <div className="max-w-6xl mx-auto">

          {/* ← Practice breadcrumb link */}
          <Skeleton variant="text" height="0.9rem" width="6rem" className="mb-5" />

          {/* Difficulty + metric + tag badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Skeleton height="1.4rem" width="5.5rem" className="rounded-full" />
            <Skeleton variant="text" height="0.75rem" width="4rem" />
            <Skeleton height="1.4rem" width="5rem" className="rounded-full" />
            <Skeleton height="1.4rem" width="4.5rem" className="rounded-full" />
          </div>

          {/* Title */}
          <Skeleton variant="text" height="2.5rem" width="75%" className="mb-3" />

          {/* Description */}
          <Skeleton variant="text" height="1rem" width="100%" className="mb-1.5" />
          <Skeleton variant="text" height="1rem" width="80%" className="mb-5" />

          {/* Submit CTA button */}
          <Skeleton height="2.25rem" width="10rem" />
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="px-4 sm:px-6 pb-12">
        <div className="max-w-6xl mx-auto">

          {/* Tab navigation */}
          <div className="flex border-b border-border-default mb-6 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
            {['Overview', 'Leaderboard', 'My Submissions'].map((label) => (
              <Skeleton
                key={label}
                height="2.75rem"
                width="7rem"
                className="shrink-0 mr-1"
              />
            ))}
          </div>

          {/* Overview tab content: 2-col on lg */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
            {/* Problem statement */}
            <Card className="lg:col-span-2 p-4 sm:p-6 space-y-3">
              <Skeleton variant="text" height="1.4rem" width="12rem" />
              <Skeleton variant="text" height="1rem" width="100%" />
              <Skeleton variant="text" height="1rem" width="95%" />
              <Skeleton variant="text" height="1rem" width="88%" />
              <Skeleton variant="text" height="1rem" width="100%" />
              <Skeleton variant="text" height="1rem" width="70%" />
            </Card>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* At a glance */}
              <Card className="p-4 sm:p-5 space-y-4">
                <Skeleton variant="text" height="0.7rem" width="7rem" />
                <div className="space-y-2.5">
                  {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="flex items-center justify-between gap-3">
                      <Skeleton variant="text" height="0.85rem" width="40%" />
                      <Skeleton variant="text" height="0.85rem" width="35%" />
                    </div>
                  ))}
                </div>
              </Card>

              {/* Downloads */}
              <Card className="p-4 sm:p-5 space-y-3">
                <Skeleton variant="text" height="0.7rem" width="6rem" />
                <Skeleton height="2.25rem" width="100%" />
                <Skeleton height="2.25rem" width="100%" />
              </Card>

              {/* Submit CTA */}
              <Card className="p-4 sm:p-5 space-y-3">
                <Skeleton variant="text" height="0.9rem" width="8rem" />
                <Skeleton variant="text" height="0.8rem" width="100%" />
                <Skeleton variant="text" height="0.8rem" width="85%" />
                <Skeleton height="2.25rem" width="100%" />
              </Card>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
