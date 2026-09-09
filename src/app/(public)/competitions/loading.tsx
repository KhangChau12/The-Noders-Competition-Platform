import Skeleton from '@/components/ui/Skeleton';
import {
  CompetitionCardSkeleton,
  SectionHeadingSkeleton,
} from '@/components/ui/PageSkeletons';

const S = Skeleton;

export default function CompetitionsLoading() {
  return (
    <div className="min-h-screen px-4 sm:px-6 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto">

        {/* Header — kicker + h1 + subtitle (stats line only appears once loaded) */}
        <div className="relative mb-6 sm:mb-10 overflow-hidden">
          <S variant="text" height="0.75rem" width="13rem" className="mb-2" />
          <S variant="text" height="2.75rem" width="15rem" className="mb-3" />
          <S variant="text" height="1.1rem" width="24rem" className="max-w-full" />
        </div>

        {/* Toolbar: search | (status segmented control + sort select) */}
        <div className="flex flex-col lg:flex-row gap-2.5 sm:gap-3 mb-6 sm:mb-8 lg:items-center">
          {/* Search */}
          <S height="2.75rem" className="flex-1 lg:max-w-md rounded-lg" />

          <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 sm:gap-3 min-w-0">
            {/* Status segmented control */}
            <div className="flex flex-1 sm:flex-none rounded-lg border border-border-default bg-bg-surface p-1 gap-1">
              {['3rem', '5.5rem', '4.5rem', '3.5rem'].map((w, i) => (
                <S key={i} height="2rem" width={w} className="rounded-md shrink-0" />
              ))}
            </div>
            {/* Sort select */}
            <S height="2.75rem" width="8.75rem" className="rounded-lg shrink-0" />
          </div>
        </div>

        {/* Section heading + card grid — the shape every outcome shares
            (spotlight-led, live, or past-only). No spotlight skeleton: a real
            spotlight sliding in above the grid is far less jarring than a
            skeleton spotlight that vanishes when there is no open competition. */}
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
