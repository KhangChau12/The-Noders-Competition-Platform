import Skeleton from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';

export default function AdminCertificatesLoading() {
  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-7xl mx-auto">

        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="space-y-2">
            <Skeleton variant="text" height="2.75rem" width="18rem" />
            <Skeleton variant="text" height="1rem" width="20rem" />
          </div>
          <Skeleton height="2.75rem" width="12rem" className="shrink-0" />
        </div>

        {/* Competitions list card */}
        <Card className="overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-border-default bg-bg-elevated">
            <Skeleton variant="text" height="1.4rem" width="16rem" />
          </div>
          <div className="divide-y divide-border-default">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4 sm:p-6 flex flex-wrap items-center justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <Skeleton variant="text" height="1.1rem" width="50%" />
                    <Skeleton height="1.4rem" width="5rem" className="rounded-full" />
                  </div>
                  <div className="flex items-center gap-4">
                    <Skeleton variant="text" height="0.75rem" width="9rem" />
                    <Skeleton variant="text" height="0.75rem" width="7rem" />
                  </div>
                </div>
                <Skeleton variant="circular" width="1.5rem" height="1.5rem" />
              </div>
            ))}
          </div>
        </Card>

      </div>
    </div>
  );
}
