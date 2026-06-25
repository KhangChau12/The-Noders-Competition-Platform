import Skeleton from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';
import {
  DashboardCompetitionRowSkeleton,
  PracticeProblemCardSkeleton,
} from '@/components/ui/PageSkeletons';

const S = Skeleton;

export default function DashboardLoading() {
  return (
    <div className="min-h-screen px-4 sm:px-6 py-8 sm:py-10">
      <div className="max-w-7xl mx-auto">

        {/* Header: h1 + welcome subtitle */}
        <div className="mb-6 sm:mb-8 space-y-1.5 sm:space-y-2">
          <S variant="text" height="2.75rem" width="12rem" />
          <S variant="text" height="1rem" width="24rem" />
        </div>

        {/* Next deadline callout card */}
        <Card className="p-4 sm:p-5 mb-8 ring-1 ring-accent-cyan/20">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
            <div className="flex-1 min-w-0 space-y-1">
              <S variant="text" height="0.7rem" width="14rem" />
              <S variant="text" height="1.1rem" width="55%" />
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <S variant="text" height="1.75rem" width="8rem" />
              <S variant="circular" width="1.25rem" height="1.25rem" />
            </div>
          </div>
        </Card>

        {/* Quick stats: 2×2 on mobile, 4-up on lg */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-10">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i} className="relative overflow-hidden p-3.5 sm:p-5 space-y-1">
              <S variant="text" height="2rem" width="3.5rem" />
              <S variant="text" height="0.65rem" width="75%" />
            </Card>
          ))}
        </div>

        {/* 2-col layout */}
        <div className="grid lg:grid-cols-[1fr_380px] gap-6 lg:gap-8 items-start">

          {/* Left column */}
          <div className="space-y-8 sm:space-y-12">

            {/* Your competitions section */}
            <section>
              <div className="flex items-center justify-between gap-3 mb-5">
                <S variant="text" height="1.6rem" width="13rem" />
                <S variant="text" height="0.85rem" width="6rem" />
              </div>
              <div className="space-y-4">
                {[0, 1, 2].map((i) => (
                  <DashboardCompetitionRowSkeleton key={i} />
                ))}
              </div>
            </section>

            {/* Open for registration section */}
            <section>
              <S variant="text" height="1.6rem" width="16rem" className="mb-5" />
              <div className="space-y-3">
                {[0, 1].map((i) => (
                  <Card key={i} className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <S variant="text" height="1rem" width="65%" />
                        <S variant="text" height="0.75rem" width="45%" />
                      </div>
                      <S height="2.25rem" width="8rem" className="shrink-0" />
                    </div>
                  </Card>
                ))}
              </div>
            </section>

            {/* Continue practicing section */}
            <section>
              <div className="flex items-center justify-between gap-3 mb-2">
                <S variant="text" height="1.6rem" width="15rem" />
                <S variant="text" height="0.85rem" width="7rem" />
              </div>
              <S variant="text" height="0.85rem" width="75%" className="mb-5" />
              <div className="grid sm:grid-cols-2 gap-4">
                {[0, 1, 2, 3].map((i) => (
                  <PracticeProblemCardSkeleton key={i} />
                ))}
              </div>
            </section>

          </div>

          {/* Right sidebar */}
          <aside className="space-y-6">

            {/* Teams card — matches TeamsSidebar: list of teams + create button */}
            <Card className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <S variant="text" height="1.4rem" width="8rem" />
                <S variant="text" height="0.75rem" width="6rem" />
              </div>
              <div className="space-y-3">
                {[0, 1].map((i) => (
                  <div key={i} className="flex items-center justify-between gap-3">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <S variant="text" height="1rem" width="60%" />
                      <S variant="text" height="0.75rem" width="40%" />
                    </div>
                    <S height="2rem" width="4rem" />
                  </div>
                ))}
              </div>
              {/* Create team button */}
              <S height="2.25rem" width="100%" />
            </Card>

            {/* Recent activity card */}
            <Card className="p-5 sm:p-6 space-y-4">
              <S variant="text" height="1.4rem" width="10rem" />
              <div className="space-y-1">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="py-2 -mx-2 px-2 space-y-0.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <S variant="text" height="0.9rem" width="60%" />
                      <S variant="text" height="0.9rem" width="15%" />
                    </div>
                    <div className="flex gap-2">
                      <S variant="text" height="0.65rem" width="25%" />
                      <S variant="text" height="0.65rem" width="20%" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

          </aside>
        </div>

      </div>
    </div>
  );
}
