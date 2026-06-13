import Skeleton from '@/components/ui/Skeleton';
import {
  SpotlightCardSkeleton,
  CompetitionCardSkeleton,
  SectionHeadingSkeleton,
} from '@/components/ui/PageSkeletons';

export default function CompetitionsLoading() {
  return (
    <div className="min-h-screen px-4 sm:px-6 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto">

        {/* Header — kicker + h1 + subtitle + stats line */}
        <div className="relative mb-6 sm:mb-10 overflow-hidden">
          <Skeleton variant="text" height="0.7rem" width="14rem" className="mb-2" />
          <Skeleton variant="text" height="3rem" width="12rem" className="mb-3" />
          <Skeleton variant="text" height="1rem" width="28rem" className="mb-3 sm:mb-4" />
          <Skeleton variant="text" height="0.7rem" width="22rem" />
        </div>

        {/* Toolbar: search | segmented-control + sort-select */}
        <div className="flex flex-col lg:flex-row gap-2.5 sm:gap-3 mb-6 sm:mb-8 lg:items-center">
          {/* Search */}
          <Skeleton height="2.75rem" className="flex-1 lg:max-w-md" />

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Status segmented control */}
            <div className="flex flex-1 sm:flex-none rounded-lg border border-border-default bg-bg-surface p-1 gap-1">
              {[56, 80, 64, 48].map((w, i) => (
                <Skeleton key={i} height="2rem" width={`${w}px`} className="rounded-md shrink-0" />
              ))}
            </div>
            {/* Sort select */}
            <Skeleton height="2.75rem" width="8rem" className="rounded-lg shrink-0" />
          </div>
        </div>

        {/* Spotlight section */}
        <div className="mb-8 sm:mb-12">
          <Skeleton variant="text" height="0.7rem" width="16rem" className="mb-2.5 sm:mb-3 px-1" />
          <SpotlightCardSkeleton />
        </div>

        {/* More competitions grid */}
        <div className="space-y-4 sm:space-y-5">
          <SectionHeadingSkeleton kicker />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {[0, 1, 2, 3].map((i) => (
              <CompetitionCardSkeleton key={i} />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
