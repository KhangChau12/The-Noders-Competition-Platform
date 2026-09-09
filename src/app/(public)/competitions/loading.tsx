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

        {/* Header — h1 + subtitle + a 4-item stat run */}
        <div className="mb-6 sm:mb-10">
          <S variant="text" height="1.75rem" width="13rem" className="mb-2" />
          <S variant="text" height="1rem" width="26rem" className="max-w-full mb-5" />
          <div className="flex flex-wrap gap-x-9 gap-y-6">
            {['3rem', '5rem', '5.5rem', '3rem'].map((w, i) => (
              <div key={i} className="space-y-1.5">
                <S variant="text" height="1.375rem" width={w} />
                <S variant="text" height="0.75rem" width="4.5rem" />
              </div>
            ))}
          </div>
        </div>

        {/* Toolbar — bottom-border search + underline segmented controls */}
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 mb-6 sm:mb-8 lg:items-end">
          <S height="2.75rem" className="flex-1 lg:max-w-md rounded-lg" />
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            <div className="flex gap-[18px]">
              {['3rem', '5.5rem', '4.5rem', '3.5rem'].map((w, i) => (
                <S key={i} height="1.75rem" width={w} className="rounded-md shrink-0" />
              ))}
            </div>
            <div className="flex gap-[18px]">
              {['3rem', '5.5rem', '5rem'].map((w, i) => (
                <S key={i} height="1.75rem" width={w} className="rounded-md shrink-0" />
              ))}
            </div>
          </div>
        </div>

        {/* Section heading + card grid */}
        <div className="space-y-4 sm:space-y-5">
          <SectionHeadingSkeleton />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {[0, 1, 2, 3].map((i) => (
              <CompetitionCardSkeleton key={i} />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
