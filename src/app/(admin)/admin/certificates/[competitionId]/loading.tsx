import Skeleton from '@/components/ui/Skeleton';
import { AdminTableSkeleton } from '@/components/ui/PageSkeletons';

export default function CertificatesDetailLoading() {
  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-8 space-y-4">
          {/* ← Back link */}
          <Skeleton variant="text" height="0.9rem" width="12rem" />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <Skeleton variant="text" height="2.75rem" width="70%" />
              <div className="flex items-center gap-3">
                <Skeleton variant="text" height="0.85rem" width="10rem" />
                <Skeleton height="1.4rem" width="6rem" className="rounded-full" />
              </div>
            </div>
            <Skeleton height="2.75rem" width="12rem" className="shrink-0" />
          </div>
        </div>

        <AdminTableSkeleton rows={8} cols={4} />

      </div>
    </div>
  );
}
