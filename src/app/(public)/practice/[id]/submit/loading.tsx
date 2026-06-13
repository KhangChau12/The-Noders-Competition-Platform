import Skeleton from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';

export default function PracticeSubmitLoading() {
  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-2xl mx-auto">

        {/* ← Back button */}
        <Skeleton height="2.25rem" width="10rem" className="mb-6" />

        {/* Page heading */}
        <div className="mb-8 space-y-2">
          <Skeleton variant="text" height="2.75rem" width="70%" />
          <Skeleton variant="text" height="1rem" width="55%" />
        </div>

        {/* PracticeSubmitForm card */}
        <Card className="p-6 space-y-6">
          {/* Quota / limit info */}
          <div className="rounded-xl bg-bg-elevated p-4 space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton variant="text" height="0.85rem" width="9rem" />
              <Skeleton variant="text" height="0.85rem" width="4rem" />
            </div>
            <Skeleton variant="text" height="0.75rem" width="12rem" />
          </div>

          {/* File upload area */}
          <div className="space-y-1.5">
            <Skeleton variant="text" height="0.85rem" width="5rem" />
            <div className="rounded-xl border-2 border-dashed border-border-default h-32 flex flex-col items-center justify-center gap-3">
              <Skeleton variant="circular" width="2.5rem" height="2.5rem" />
              <Skeleton variant="text" height="0.85rem" width="12rem" />
            </div>
          </div>

          <Skeleton height="2.75rem" width="100%" />
        </Card>

      </div>
    </div>
  );
}
