import Skeleton from '@/components/ui/Skeleton';
import { PracticeProblemCardSkeleton } from '@/components/ui/PageSkeletons';

const S = Skeleton;

export default function PracticeLoading() {
  return (
    <div className="min-h-screen px-4 sm:px-6 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto">

        {/* Header — kicker + h1 + subtitle (2 lines) + stats line */}
        <div className="relative mb-6 sm:mb-10 overflow-hidden">
          <S variant="text" height="0.75rem" width="15rem" className="mb-2" />
          <S variant="text" height="2.75rem" width="17rem" className="mb-3" />
          <div className="space-y-1.5 mb-3 sm:mb-4 max-w-2xl">
            <S variant="text" height="1rem" width="100%" />
            <S variant="text" height="1rem" width="60%" />
          </div>
          <S variant="text" height="0.7rem" width="18rem" />
        </div>

        {/* Toolbar: search + difficulty segmented control */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <S height="2.75rem" className="flex-1 sm:max-w-sm rounded-lg" />
          <div className="flex w-full sm:w-auto sm:inline-flex sm:self-start rounded-lg border border-border-default bg-bg-surface p-1 gap-1">
            {['3rem', '5rem', '4.5rem', '5rem'].map((w, i) => (
              <S key={i} height="2rem" width={w} className="rounded-md shrink-0 flex-1 sm:flex-none" />
            ))}
          </div>
        </div>

        {/* Topic tag filter row */}
        <div className="flex items-center gap-2 mb-6 sm:mb-8 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
          <S variant="text" height="0.7rem" width="3.5rem" className="mr-1 shrink-0" />
          {['3rem', '3.5rem', '4rem', '3.25rem', '4.5rem', '3.5rem'].map((w, i) => (
            <S key={i} height="1.75rem" width={w} className="rounded-full shrink-0" />
          ))}
        </div>

        {/* Problem grid — 1 / 2 / 3 columns */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <PracticeProblemCardSkeleton key={i} />
          ))}
        </div>

      </div>
    </div>
  );
}
