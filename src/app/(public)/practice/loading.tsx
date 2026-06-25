import Skeleton from '@/components/ui/Skeleton';
import { PracticeProblemCardSkeleton } from '@/components/ui/PageSkeletons';

const S = Skeleton;

export default function PracticeLoading() {
  return (
    <div className="min-h-screen px-4 sm:px-6 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto">

        {/* Header — kicker + h1 + subtitle + stats line */}
        <div className="relative mb-6 sm:mb-10 overflow-hidden">
          <S variant="text" height="0.7rem" width="16rem" className="mb-2" />
          <S variant="text" height="3rem" width="14rem" className="mb-3" />
          <S variant="text" height="1rem" width="32rem" className="mb-3 sm:mb-4" />
          <S variant="text" height="0.7rem" width="22rem" />
        </div>

        {/* Personal progress strip (shown when user has attempted problems) */}
        <div className="relative overflow-hidden mb-6 sm:mb-8 rounded-xl border border-border-default bg-bg-surface p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8">
            <div className="flex-1 min-w-0">
              <S variant="text" height="0.7rem" width="7rem" className="mb-2" />
              <div className="flex items-center gap-3">
                <S height="0.5rem" className="flex-1 rounded-full" />
                <S variant="text" height="0.75rem" width="7rem" className="shrink-0" />
              </div>
            </div>
            <div className="flex items-baseline gap-6 sm:gap-8 shrink-0">
              <div className="space-y-1">
                <S variant="text" height="1.5rem" width="3rem" />
                <S variant="text" height="0.65rem" width="4rem" />
              </div>
              <div className="space-y-1">
                <S variant="text" height="1.5rem" width="2.5rem" />
                <S variant="text" height="0.65rem" width="5rem" />
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar: search + difficulty segmented control */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <S height="2.75rem" className="flex-1 sm:max-w-sm" />
          <div className="flex w-full sm:w-auto sm:inline-flex rounded-lg border border-border-default bg-bg-surface p-1 gap-1">
            {['All', 'Beginner', 'Medium', 'Advanced'].map((label) => (
              <S key={label} height="2rem" width="5rem" className="rounded-md shrink-0 flex-1 sm:flex-none" />
            ))}
          </div>
        </div>

        {/* Topic tag filter row */}
        <div className="flex items-center gap-2 mb-6 sm:mb-8 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap pb-1">
          <S variant="text" height="0.7rem" width="4rem" className="mr-1 shrink-0" />
          {[48, 56, 64, 52, 72, 56, 48, 60].map((w, i) => (
            <S key={i} height="1.75rem" width={`${w}px`} className="rounded-full shrink-0" />
          ))}
        </div>

        {/* Problem grid — 3 cols on lg */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <PracticeProblemCardSkeleton key={i} />
          ))}
        </div>

      </div>
    </div>
  );
}
