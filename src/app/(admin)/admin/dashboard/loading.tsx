import Skeleton from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';
import { AdminTableSkeleton } from '@/components/ui/PageSkeletons';

export default function AdminDashboardLoading() {
  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-7xl mx-auto">

        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="space-y-2">
            <Skeleton variant="text" height="2.75rem" width="16rem" />
            <Skeleton variant="text" height="1rem" width="20rem" />
          </div>
          <Skeleton height="2.75rem" width="12rem" className="shrink-0" />
        </div>

        {/* Stats: 5-up grid (2×3 on mobile, 5 on lg) */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-10">
          {[0, 1, 2, 3, 4].map((i) => (
            <Card key={i} className="relative overflow-hidden p-4 sm:p-5 space-y-1">
              <Skeleton variant="text" height="2rem" width="3.5rem" />
              <Skeleton variant="text" height="0.65rem" width="70%" />
              <Skeleton variant="text" height="0.6rem" width="55%" />
            </Card>
          ))}
        </div>

        {/* Pending registrations section */}
        <div className="mb-12">
          <div className="flex items-center justify-between gap-3 mb-6">
            <Skeleton variant="text" height="1.6rem" width="14rem" />
            <Skeleton height="1.4rem" width="6rem" className="rounded-full" />
          </div>
          <AdminTableSkeleton rows={5} cols={5} />
        </div>

        {/* Active competitions */}
        <section className="space-y-4 mb-10">
          <Skeleton variant="text" height="1.6rem" width="14rem" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <Card key={i} className="p-5 space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Skeleton height="1.4rem" width="7rem" className="rounded-full" />
                  <Skeleton height="1.4rem" width="5rem" className="rounded-full" />
                </div>
                <Skeleton variant="text" height="1.1rem" width="75%" />
                <Skeleton variant="text" height="0.75rem" width="55%" />
                <Skeleton height="2.25rem" width="8rem" />
              </Card>
            ))}
          </div>
        </section>

        {/* Recent submissions */}
        <section className="space-y-4">
          <Skeleton variant="text" height="1.6rem" width="12rem" />
          <AdminTableSkeleton rows={8} cols={5} />
        </section>

      </div>
    </div>
  );
}
