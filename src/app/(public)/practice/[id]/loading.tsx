import Skeleton from '@/components/ui/Skeleton';

const S = Skeleton;

// Mirrors the redesigned single-column practice detail page:
// breadcrumb → eyebrow → title → description → stat run → action line → tabs.
export default function PracticeDetailLoading() {
  return (
    <div className="min-h-screen px-4 sm:px-6 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto">

        {/* Breadcrumb */}
        <S variant="text" height="0.75rem" width="5rem" className="mb-3.5" />

        {/* Eyebrow */}
        <S variant="text" height="0.75rem" width="12rem" className="mb-2.5" />

        {/* Title */}
        <S variant="text" height="2rem" width="55%" className="max-w-full mb-2.5" />

        {/* Description (3 lines) */}
        <div className="space-y-1.5 mb-6">
          <S variant="text" height="0.875rem" width="100%" />
          <S variant="text" height="0.875rem" width="90%" />
          <S variant="text" height="0.875rem" width="45%" />
        </div>

        {/* Stat run */}
        <div className="flex flex-wrap gap-x-7 gap-y-[18px] mb-6">
          {['6rem', '4rem', '5rem', '4rem'].map((w, i) => (
            <div key={i} className="space-y-1.5">
              <S variant="text" height="0.9375rem" width={w} />
              <S variant="text" height="0.75rem" width="5rem" />
            </div>
          ))}
        </div>

        {/* Action line */}
        <div className="flex items-center gap-x-[18px] mb-6">
          <S height="2.5rem" width="9rem" className="rounded-lg" />
          <S variant="text" height="1rem" width="5rem" />
          <S variant="text" height="1rem" width="8rem" />
        </div>

        {/* Tab nav */}
        <div className="flex gap-4 border-b border-border-default mb-5">
          {['5rem', '7rem', '8rem'].map((w, i) => (
            <S key={i} height="2.5rem" width={w} className="shrink-0" />
          ))}
        </div>

        {/* Leaderboard table skeleton */}
        <div className="rounded-[10px] border border-border-default overflow-hidden">
          <div className="bg-bg-elevated px-3.5 py-3">
            <S variant="text" height="0.75rem" width="55%" />
          </div>
          {[0, 1, 2, 3, 4, 5].map((i) => (
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
