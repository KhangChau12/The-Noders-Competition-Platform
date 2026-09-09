import Skeleton from '@/components/ui/Skeleton';

const S = Skeleton;

// Mirrors the redesigned single-column competition detail page:
// eyebrow → title → description → stat run → phase rail → action line → tabs.
export default function CompetitionDetailLoading() {
  return (
    <div className="min-h-screen px-4 sm:px-6 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto">

        {/* Eyebrow */}
        <S variant="text" height="0.75rem" width="16rem" className="mb-2.5" />

        {/* Title */}
        <S variant="text" height="1.875rem" width="70%" className="max-w-full mb-2.5" />

        {/* Description (3 lines) */}
        <div className="space-y-1.5 max-w-[72ch] mb-4">
          <S variant="text" height="0.875rem" width="100%" />
          <S variant="text" height="0.875rem" width="96%" />
          <S variant="text" height="0.875rem" width="70%" />
        </div>

        {/* Stat run */}
        <div className="flex flex-wrap gap-x-9 gap-y-6 mb-5">
          {['4rem', '6rem', '4rem', '5rem', '4rem'].map((w, i) => (
            <div key={i} className="space-y-1.5">
              <S variant="text" height="1.375rem" width={w} />
              <S variant="text" height="0.75rem" width="5rem" />
            </div>
          ))}
        </div>

        {/* Phase rail + marks */}
        <div className="mb-5">
          <S height="0.25rem" width="100%" className="rounded-full mb-2" />
          <div className="flex gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex-1 space-y-1">
                <S variant="text" height="0.65rem" width="70%" />
                <S variant="text" height="0.65rem" width="90%" />
              </div>
            ))}
          </div>
        </div>

        {/* Action line */}
        <div className="flex items-center gap-4 mb-6">
          <S variant="text" height="1rem" width="14rem" />
          <span className="flex-1" />
          <S height="2.5rem" width="9rem" className="rounded-lg" />
        </div>

        {/* Tab nav */}
        <div className="flex gap-4 border-b border-border-default mb-5">
          {['5rem', '8rem', '6rem'].map((w, i) => (
            <S key={i} height="2.5rem" width={w} className="shrink-0" />
          ))}
        </div>

        {/* Leaderboard table skeleton */}
        <div className="rounded-[10px] border border-border-default overflow-hidden">
          <div className="bg-bg-elevated px-3.5 py-3">
            <S variant="text" height="0.75rem" width="60%" />
          </div>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between gap-4 px-3.5 py-3 border-t border-border-default">
              <S variant="text" height="0.9rem" width="40%" />
              <S variant="text" height="0.9rem" width="4rem" />
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
