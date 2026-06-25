import Skeleton from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';

const S = Skeleton;

export default function PracticeDetailLoading() {
  return (
    <div className="min-h-screen">

      {/* ── Header area ── */}
      <div className="px-4 sm:px-6 pt-6 sm:pt-8 pb-5 sm:pb-6">
        <div className="max-w-6xl mx-auto">

          {/* ← Practice breadcrumb link */}
          <S variant="text" height="0.9rem" width="6rem" className="mb-5" />

          {/* Difficulty + metric text + tag pill badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <S height="1.4rem" width="5.5rem" className="rounded-full" />
            <S variant="text" height="0.75rem" width="4rem" />
            <S height="1.4rem" width="5rem" className="rounded-full" />
            <S height="1.4rem" width="4.5rem" className="rounded-full" />
          </div>

          {/* Title */}
          <S variant="text" height="2.5rem" width="75%" className="mb-3" />

          {/* Description */}
          <S variant="text" height="1rem" width="100%" className="mb-1.5" />
          <S variant="text" height="1rem" width="80%" className="mb-5" />

          {/* Personal stats strip (shown when user has submitted) */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-6 py-3 px-4 bg-bg-surface rounded-xl border border-border-default/60 mb-2">
            <div className="space-y-1">
              <S variant="text" height="0.6rem" width="5rem" />
              <S variant="text" height="1.1rem" width="5rem" />
            </div>
            <div className="space-y-1">
              <S variant="text" height="0.6rem" width="5rem" />
              <S variant="text" height="1.1rem" width="3.5rem" />
            </div>
            <div className="ml-auto">
              <S height="2rem" width="8rem" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="px-4 sm:px-6 pb-12">
        <div className="max-w-6xl mx-auto">

          {/* Tab navigation */}
          <div className="flex border-b border-border-default mb-6 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
            {['Overview', 'Leaderboard', 'My Submissions'].map((label) => (
              <S key={label} height="2.75rem" width="7rem" className="shrink-0 mr-1" />
            ))}
          </div>

          {/* Overview tab: 2-col on lg */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
            {/* Problem statement */}
            <Card className="lg:col-span-2 p-4 sm:p-6 space-y-3">
              <S variant="text" height="1.4rem" width="12rem" />
              <S variant="text" height="1rem" width="100%" />
              <S variant="text" height="1rem" width="95%" />
              <S variant="text" height="1rem" width="88%" />
              <S variant="text" height="1rem" width="100%" />
              <S variant="text" height="1rem" width="70%" />
            </Card>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* At a glance */}
              <Card className="p-4 sm:p-5 space-y-4">
                <S variant="text" height="0.7rem" width="7rem" />
                <div className="space-y-2.5">
                  {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="flex items-center justify-between gap-3">
                      <S variant="text" height="0.85rem" width="40%" />
                      <S variant="text" height="0.85rem" width="35%" />
                    </div>
                  ))}
                </div>
              </Card>

              {/* Downloads */}
              <Card className="p-4 sm:p-5 space-y-3">
                <S variant="text" height="0.7rem" width="6rem" />
                <S height="2.25rem" width="100%" />
                <S height="2.25rem" width="100%" />
              </Card>

              {/* Submit CTA */}
              <Card className="p-4 sm:p-5 space-y-3">
                <S variant="text" height="0.9rem" width="8rem" />
                <S variant="text" height="0.8rem" width="100%" />
                <S variant="text" height="0.8rem" width="85%" />
                <S height="2.25rem" width="100%" />
              </Card>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
