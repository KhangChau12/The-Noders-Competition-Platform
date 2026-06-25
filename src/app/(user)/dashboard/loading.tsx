import Skeleton from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';
import { DashboardCompetitionRowSkeleton, PracticeProblemCardSkeleton } from '@/components/ui/PageSkeletons';

const S = Skeleton;

export default function DashboardLoading() {
  return (
    <div className="min-h-screen px-4 sm:px-6 py-8 sm:py-10">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-6 sm:mb-8 space-y-1.5">
          <S variant="text" height="2.75rem" width="12rem" />
          <S variant="text" height="1rem" width="26rem" />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-10">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i} className="relative overflow-hidden p-3.5 sm:p-5 space-y-1">
              <S variant="text" height="2rem" width="3.5rem" />
              <S variant="text" height="0.65rem" width="75%" />
            </Card>
          ))}
        </div>

        {/* 2-col layout */}
        <div className="grid lg:grid-cols-[1fr_360px] gap-6 lg:gap-8 items-start">

          {/* Left column */}
          <div className="space-y-10">

            {/* Your Competitions */}
            <section>
              <div className="flex items-center justify-between gap-3 mb-5">
                <S variant="text" height="1.6rem" width="13rem" />
                <S variant="text" height="0.85rem" width="6rem" />
              </div>
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <DashboardCompetitionRowSkeleton key={i} />
                ))}
              </div>
            </section>

            {/* Open for Registration */}
            <section>
              <div className="flex items-center justify-between gap-3 mb-4">
                <S variant="text" height="1.1rem" width="14rem" />
                <S variant="text" height="0.85rem" width="5rem" />
              </div>
              <div className="space-y-2">
                {[0, 1].map((i) => (
                  <Card key={i} className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <S variant="text" height="0.95rem" width="65%" />
                        <S variant="text" height="0.75rem" width="45%" />
                      </div>
                      <S height="2rem" width="6rem" className="shrink-0" />
                    </div>
                  </Card>
                ))}
              </div>
            </section>

            {/* Continue Practicing */}
            <section>
              <div className="flex items-center justify-between gap-3 mb-2">
                <S variant="text" height="1.6rem" width="15rem" />
                <S variant="text" height="0.85rem" width="7rem" />
              </div>
              <S variant="text" height="0.85rem" width="70%" className="mb-5" />
              <div className="grid sm:grid-cols-2 gap-4">
                {[0, 1, 2, 3].map((i) => (
                  <PracticeProblemCardSkeleton key={i} />
                ))}
              </div>
            </section>
          </div>

          {/* Right sidebar */}
          <aside className="space-y-4">

            {/* Teams card */}
            <Card className="p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <S variant="text" height="1.1rem" width="8rem" />
                <S variant="text" height="0.7rem" width="4rem" />
              </div>
              <div className="space-y-1.5">
                {[0, 1].map((i) => (
                  <div key={i} className="flex items-center justify-between gap-3 px-3 py-2.5">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <S variant="text" height="0.9rem" width="60%" />
                      <S variant="text" height="0.7rem" width="40%" />
                    </div>
                    <S variant="circular" width="1rem" height="1rem" />
                  </div>
                ))}
              </div>
              {/* Create + Browse buttons */}
              <div className="grid grid-cols-2 gap-2">
                <S height="2rem" width="100%" />
                <S height="2rem" width="100%" />
              </div>
            </Card>

            {/* Recent activity card */}
            <Card className="p-4 sm:p-5 space-y-3">
              <S variant="text" height="1.1rem" width="10rem" />
              <div className="space-y-0.5">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="py-2 space-y-0.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <S variant="text" height="0.9rem" width="60%" />
                      <S variant="text" height="0.9rem" width="15%" />
                    </div>
                    <S variant="text" height="0.65rem" width="30%" />
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
