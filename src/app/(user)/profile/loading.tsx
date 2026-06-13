import Skeleton from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';

export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        {/* Page header */}
        <div className="mb-8 space-y-2">
          <Skeleton variant="text" height="2.75rem" width="12rem" />
          <Skeleton variant="text" height="1rem" width="22rem" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Profile Card (1 col) */}
          <div className="lg:col-span-1">
            <Card className="p-6">
              {/* Avatar + name + role badge */}
              <div className="flex flex-col items-center mb-6 space-y-3">
                <Skeleton variant="circular" width="6rem" height="6rem" />
                <Skeleton variant="text" height="1.4rem" width="10rem" className="mx-auto" />
                <Skeleton height="1.4rem" width="4rem" className="rounded-full mx-auto" />
              </div>

              {/* User info rows */}
              <div className="space-y-3">
                {[0, 1].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton variant="circular" width="1rem" height="1rem" className="shrink-0" />
                    <Skeleton variant="text" height="0.9rem" width="70%" />
                  </div>
                ))}
              </div>

              {/* Edit button */}
              <Skeleton height="2.75rem" width="100%" className="mt-6" />
            </Card>
          </div>

          {/* Stats + performances (2 cols) */}
          <div className="lg:col-span-2 space-y-6">

            {/* Stats: 3-col grid */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {[0, 1, 2].map((i) => (
                <Card key={i} className="relative overflow-hidden p-4 sm:p-6 space-y-1">
                  <Skeleton variant="text" height="2rem" width="3rem" />
                  <Skeleton variant="text" height="0.8rem" width="65%" />
                </Card>
              ))}
            </div>

            {/* Top performances */}
            <Card className="p-6 space-y-4">
              <Skeleton variant="text" height="1.4rem" width="11rem" />
              <div className="space-y-3">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center justify-between gap-3 p-4 bg-bg-elevated rounded-lg">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Skeleton variant="text" height="1.1rem" width="2rem" className="shrink-0" />
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <Skeleton variant="text" height="0.9rem" width="70%" />
                        <Skeleton variant="text" height="0.75rem" width="45%" />
                      </div>
                    </div>
                    <div className="text-right shrink-0 space-y-1">
                      <Skeleton variant="text" height="1.1rem" width="5rem" />
                      <Skeleton variant="text" height="0.7rem" width="3rem" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

          </div>
        </div>

      </div>
    </div>
  );
}
