import Skeleton from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';
import { CertificateRowsSkeleton } from '@/components/admin/AdminSkeletons';

export default function CertificatesDetailLoading() {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Header: back link + title + action */}
      <div className="mb-6 sm:mb-8 space-y-4">
        <Skeleton variant="text" height="0.9rem" width="11rem" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2 min-w-0">
            <Skeleton variant="text" height="2rem" width="60%" className="max-w-xs" />
            <div className="flex items-center gap-3">
              <Skeleton variant="text" height="0.85rem" width="9rem" />
              <Skeleton height="1.4rem" width="5rem" className="rounded-full" />
            </div>
          </div>
          <Skeleton height="2.75rem" width="12rem" className="shrink-0 w-full sm:w-48" />
        </div>
      </div>

      {/* Info card */}
      <Card className="hover:translate-y-0 p-4 mb-6 bg-bg-elevated/50">
        <Skeleton variant="text" height="0.85rem" width="80%" className="max-w-md" />
      </Card>

      <CertificateRowsSkeleton rows={6} />
    </div>
  );
}
