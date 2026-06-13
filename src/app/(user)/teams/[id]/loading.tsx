import Skeleton from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';

export default function TeamDetailLoading() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        {/* ← Back link */}
        <Skeleton variant="text" height="0.9rem" width="11rem" className="mb-8" />

        {/* Team header card */}
        <Card className="p-6 sm:p-8 mb-8 space-y-4">
          {/* Team name + leader badge */}
          <div className="flex flex-wrap items-center gap-3">
            <Skeleton variant="text" height="1.75rem" width="55%" />
            <Skeleton height="1.4rem" width="5rem" className="rounded-full" />
          </div>
          {/* Description */}
          <Skeleton variant="text" height="1rem" width="80%" />
          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-6">
            <Skeleton variant="text" height="0.85rem" width="8rem" />
            <Skeleton variant="text" height="0.85rem" width="10rem" />
            <Skeleton variant="text" height="0.85rem" width="7rem" />
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Members list (2 cols on lg) */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 space-y-5">
              <div className="flex items-center justify-between gap-3">
                <Skeleton variant="text" height="1.4rem" width="7rem" />
                <Skeleton height="2.25rem" width="8rem" />
              </div>
              <div className="space-y-3">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4 py-2 border-b border-border-default/50 last:border-0">
                    <Skeleton variant="circular" width="2.5rem" height="2.5rem" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton variant="text" height="0.9rem" width="50%" />
                      <Skeleton variant="text" height="0.75rem" width="60%" />
                    </div>
                    <Skeleton height="1.4rem" width="4.5rem" className="rounded-full" />
                  </div>
                ))}
              </div>
            </Card>

            {/* Pending invitations */}
            <Card className="p-6 space-y-4">
              <Skeleton variant="text" height="1.4rem" width="10rem" />
              <div className="space-y-3">
                {[0, 1].map((i) => (
                  <div key={i} className="flex items-center justify-between gap-3 p-3 bg-bg-elevated rounded-xl">
                    <div className="space-y-1.5 flex-1">
                      <Skeleton variant="text" height="0.9rem" width="55%" />
                      <Skeleton variant="text" height="0.75rem" width="40%" />
                    </div>
                    <Skeleton height="2rem" width="5rem" />
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Sidebar: invite form (1 col on lg) */}
          <div className="space-y-6">
            <Card className="p-6 space-y-4">
              <Skeleton variant="text" height="1.4rem" width="8rem" />
              <div className="space-y-1.5">
                <Skeleton variant="text" height="0.85rem" width="6rem" />
                <Skeleton height="2.75rem" width="100%" />
              </div>
              <Skeleton height="2.75rem" width="100%" />
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}
