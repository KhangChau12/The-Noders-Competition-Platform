import Skeleton from '@/components/ui/Skeleton';
import { AdminTableSkeleton } from '@/components/ui/PageSkeletons';

export default function AdminPracticeLoading() {
  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-7xl mx-auto">

        {/* Header row */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div className="space-y-2">
            <Skeleton variant="text" height="2.75rem" width="16rem" />
            <Skeleton variant="text" height="1rem" width="22rem" />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Skeleton height="2.75rem" width="10rem" />
            <Skeleton height="2.75rem" width="9rem" />
          </div>
        </div>

        <AdminTableSkeleton rows={8} cols={5} />

      </div>
    </div>
  );
}
