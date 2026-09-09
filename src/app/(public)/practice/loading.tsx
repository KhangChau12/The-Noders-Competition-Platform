import Skeleton from '@/components/ui/Skeleton';
import { PracticeProblemCardSkeleton } from '@/components/ui/PageSkeletons';

const S = Skeleton;

export default function PracticeLoading() {
  return (
    <div className="min-h-screen px-4 sm:px-6 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto">

        {/* Header — h1 + subtitle + stat run */}
        <div className="mb-6 sm:mb-10">
          <S variant="text" height="1.75rem" width="15rem" className="mb-2" />
          <S variant="text" height="1rem" width="24rem" className="max-w-full mb-5" />
          <div className="flex flex-wrap gap-x-9 gap-y-6">
            {['3rem', '3rem', '5.5rem'].map((w, i) => (
              <div key={i} className="space-y-1.5">
                <S variant="text" height="1.375rem" width={w} />
                <S variant="text" height="0.75rem" width="4.5rem" />
              </div>
            ))}
          </div>
        </div>

        {/* Toolbar — bottom-border search + underline difficulty control */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 sm:items-end mb-4">
          <S height="2.75rem" className="flex-1 sm:max-w-sm rounded-lg" />
          <div className="flex gap-[18px]">
            {['5rem', '5rem', '6rem', '5rem'].map((w, i) => (
              <S key={i} height="1.75rem" width={w} className="rounded-md shrink-0" />
            ))}
          </div>
        </div>

        {/* Topic filter row */}
        <div className="flex items-center gap-[18px] mb-6 sm:mb-8 overflow-x-auto scrollbar-none">
          {['4rem', '3rem', '5rem', '4rem', '4.5rem', '3.5rem'].map((w, i) => (
            <S key={i} variant="text" height="0.85rem" width={w} className="shrink-0" />
          ))}
        </div>

        {/* Problem grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <PracticeProblemCardSkeleton key={i} />
          ))}
        </div>

      </div>
    </div>
  );
}
