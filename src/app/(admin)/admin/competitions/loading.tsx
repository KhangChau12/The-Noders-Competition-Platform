import Skeleton from '@/components/ui/Skeleton';
import { AdminTableSkeleton } from '@/components/ui/PageSkeletons';

export default function AdminCompetitionsLoading() {
  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-7xl mx-auto">

        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="space-y-2">
            <Skeleton variant="text" height="2.75rem" width="14rem" />
            <Skeleton variant="text" height="1rem" width="18rem" />
          </div>
          <Skeleton height="2.75rem" width="12rem" className="shrink-0" />
        </div>

        <AdminTableSkeleton rows={8} cols={6} />

      </div>
    </div>
  );
}
