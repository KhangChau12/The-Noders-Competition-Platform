import Skeleton from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';

const S = Skeleton;

export default function CompetitionDetailLoading() {
  return (
    <div className="min-h-screen">

      {/* ── Hero header ── */}
      <div className="px-4 sm:px-6 pt-8 pb-6 sm:pt-10 sm:pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Phase badge + meta */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <S height="1.5rem" width="9rem" className="rounded-full" />
            <S variant="text" height="0.75rem" width="10rem" />
          </div>
          {/* Title */}
          <S variant="text" height="3rem" width="70%" className="mb-3" />
          {/* Description */}
          <S variant="text" height="1rem" width="100%" className="mb-1.5" />
          <S variant="text" height="1rem" width="75%" className="mb-5" />
          {/* Quick stats row */}
          <div className="flex items-center gap-4 sm:gap-6 pb-1">
            <S variant="text" height="0.9rem" width="7rem" />
            <S variant="text" height="0.9rem" width="7rem" />
            <S variant="text" height="0.9rem" width="8rem" />
          </div>
        </div>
      </div>

      {/* ── Main body ── */}
      <div className="px-4 sm:px-6 pb-12">
        <div className="max-w-7xl mx-auto">

          {/* Mobile action strip */}
          <div className="lg:hidden mb-5 flex gap-2">
            <S height="2.25rem" className="flex-1" />
            <S height="2.25rem" className="flex-1" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── Left / main (2 cols on lg) ── */}
            <div className="lg:col-span-2 space-y-5">

              {/* Countdown + timeline card */}
              <Card className="p-4 sm:p-6 overflow-hidden">
                <S variant="text" height="0.75rem" width="12rem" className="mb-3" />
                {/* Countdown digits */}
                <div className="flex gap-4 mb-5">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="space-y-1">
                      <S height="2.5rem" width="3.5rem" />
                      <S variant="text" height="0.65rem" width="3.5rem" />
                    </div>
                  ))}
                </div>
                {/* HorizontalTimeline */}
                <div className="pt-4 border-t border-border-default">
                  <div className="flex items-start justify-between gap-2">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="flex-1 flex flex-col items-center space-y-2">
                        <S variant="circular" width="2.5rem" height="2.5rem" />
                        <S variant="text" height="0.7rem" width="80%" className="mx-auto" />
                        <S variant="text" height="0.6rem" width="60%" className="mx-auto" />
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Dataset & Submission card (desktop only) */}
              <Card className="hidden lg:block p-5">
                <S variant="text" height="0.7rem" width="12rem" className="mb-4" />
                <div className="flex gap-3">
                  <S height="2.75rem" className="flex-1" />
                  <S height="2.75rem" className="flex-1" />
                </div>
              </Card>

              {/* Tab navigation */}
              <div className="flex border-b border-border-default overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
                {['Overview', 'Leaderboard', 'My Submissions'].map((label) => (
                  <S key={label} height="2.75rem" width="7rem" className="shrink-0 mr-1" />
                ))}
              </div>

              {/* Tab content — overview skeleton */}
              <Card className="p-4 sm:p-6 space-y-3">
                <S variant="text" height="1.4rem" width="50%" />
                <S variant="text" height="1rem" width="100%" />
                <S variant="text" height="1rem" width="95%" />
                <S variant="text" height="1rem" width="88%" />
                <S variant="text" height="1rem" width="100%" />
                <S variant="text" height="1rem" width="72%" />
              </Card>
            </div>

            {/* ── Sidebar (1 col on lg) ── */}
            <div className="space-y-5">

              {/* Your Status card */}
              <Card className="p-4 sm:p-5">
                <S variant="text" height="0.7rem" width="7rem" className="mb-4" />
                <div className="flex items-start gap-3 p-3 bg-bg-elevated/60 rounded-xl mb-4">
                  <S variant="circular" width="1rem" height="1rem" className="mt-0.5 shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <S variant="text" height="0.9rem" width="60%" />
                    <S variant="text" height="0.75rem" width="45%" />
                  </div>
                </div>
                {/* Quota grid */}
                <div className="grid grid-cols-2 gap-3">
                  {[0, 1].map((i) => (
                    <div key={i} className="p-3 bg-bg-elevated rounded-xl border border-border-default space-y-1.5">
                      <S variant="text" height="0.7rem" width="3rem" />
                      <S variant="text" height="1.5rem" width="4rem" />
                    </div>
                  ))}
                </div>
              </Card>

              {/* Evaluation card */}
              <Card className="p-4 sm:p-5">
                <S variant="text" height="0.7rem" width="7rem" className="mb-4" />
                <div className="space-y-3">
                  {/* Scoring Metric block */}
                  <div className="p-3 bg-bg-elevated rounded-xl border border-border-default space-y-1.5">
                    <S variant="text" height="0.7rem" width="8rem" />
                    <S variant="text" height="1rem" width="6rem" />
                    <S variant="text" height="0.75rem" width="9rem" />
                  </div>
                  {/* Submission Format block */}
                  <div className="p-3 bg-bg-elevated rounded-xl border border-border-default space-y-1.5">
                    <S variant="text" height="0.7rem" width="9rem" />
                    <S variant="text" height="1rem" width="5rem" />
                    <S variant="text" height="0.75rem" width="6rem" />
                  </div>
                </div>
              </Card>

              {/* Top Participants card */}
              <Card className="p-4 sm:p-5">
                <S variant="text" height="0.7rem" width="10rem" className="mb-4" />
                <div className="space-y-2">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-bg-elevated border border-border-default">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <S variant="text" height="0.9rem" width="2rem" className="shrink-0" />
                        <S variant="text" height="0.9rem" width="55%" />
                      </div>
                      <S variant="text" height="0.9rem" width="4rem" className="shrink-0 ml-2" />
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
