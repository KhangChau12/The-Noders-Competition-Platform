import Skeleton from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';

export default function RegisterLoading() {
  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-3xl mx-auto">

        {/* ← Back link */}
        <Skeleton variant="text" height="0.9rem" width="12rem" className="mb-6" />

        {/* Page heading */}
        <div className="mb-8 space-y-2">
          <Skeleton variant="text" height="3rem" width="70%" />
          <Skeleton variant="text" height="1rem" width="50%" />
        </div>

        {/* Competition Details card */}
        <Card className="p-5 sm:p-8 mb-6 space-y-5">
          <Skeleton variant="text" height="1.6rem" width="12rem" />
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton variant="circular" width="1.25rem" height="1.25rem" className="mt-0.5 shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton variant="text" height="0.9rem" width="40%" />
                  <Skeleton variant="text" height="0.85rem" width="60%" />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Registration Form card */}
        <Card className="p-5 sm:p-8 space-y-6">
          <Skeleton variant="text" height="1.6rem" width="10rem" />
          <div className="space-y-4">
            {[0, 1].map((i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton variant="text" height="0.85rem" width="6rem" />
                <Skeleton height="2.75rem" width="100%" />
              </div>
            ))}
          </div>
          <Skeleton height="2.75rem" width="100%" />
        </Card>

      </div>
    </div>
  );
}
