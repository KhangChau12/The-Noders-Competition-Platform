import Skeleton from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';

const S = Skeleton;

export default function TeamDetailLoading() {
  return (
    <div className="min-h-screen px-4 sm:px-6 py-8 sm:py-10">
      <div className="max-w-3xl mx-auto">

        {/* Back link */}
        <S variant="text" height="0.9rem" width="5rem" className="mb-6" />

        {/* Team Hero */}
        <Card className="p-5 sm:p-7 mb-6 space-y-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <S variant="text" height="1.9rem" width="55%" />
            <S height="1.4rem" width="5rem" className="rounded-full" />
          </div>
          <S variant="text" height="0.9rem" width="80%" />
          <div className="flex flex-wrap gap-x-5 gap-y-1.5">
            <S variant="text" height="0.75rem" width="6rem" />
            <S variant="text" height="0.75rem" width="8rem" />
            <S variant="text" height="0.75rem" width="8rem" />
          </div>
        </Card>

        {/* Members card */}
        <Card className="p-5 sm:p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <S variant="text" height="1.1rem" width="7rem" />
          </div>
          <div className="space-y-1">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between gap-3 px-3 py-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  <S variant="circular" width="2.25rem" height="2.25rem" className="shrink-0" />
                  <div className="space-y-1.5 min-w-0">
                    <S variant="text" height="0.9rem" width="8rem" />
                    <S variant="text" height="0.75rem" width="10rem" />
                  </div>
                </div>
                <S variant="text" height="0.75rem" width="6rem" className="shrink-0" />
              </div>
            ))}
          </div>
        </Card>

        {/* Management panel (leader) */}
        <div className="space-y-4">
          {/* Edit team card */}
          <Card className="p-5 sm:p-6 space-y-3">
            <div className="flex items-center justify-between">
              <S variant="text" height="1.1rem" width="7rem" />
              <S height="2rem" width="5rem" className="rounded-lg" />
            </div>
            <div className="space-y-2">
              <S variant="text" height="0.75rem" width="4rem" />
              <S variant="text" height="0.9rem" width="60%" />
            </div>
          </Card>

          {/* Add member card */}
          <Card className="p-5 sm:p-6 space-y-4">
            <S variant="text" height="1.1rem" width="8rem" />
            <S height="2.5rem" width="10rem" className="rounded-lg" />
            <S height="2.5rem" className="w-full rounded-lg" />
            <S height="2rem" width="9rem" className="rounded-lg" />
          </Card>

          {/* Danger zone card */}
          <Card className="p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <S variant="text" height="1.1rem" width="8rem" />
                <S variant="text" height="0.75rem" width="14rem" />
              </div>
              <S height="2rem" width="8rem" className="rounded-lg shrink-0" />
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
