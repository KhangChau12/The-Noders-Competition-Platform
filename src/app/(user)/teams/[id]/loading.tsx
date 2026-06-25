import Skeleton from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';

const S = Skeleton;

export default function TeamDetailLoading() {
  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        {/* ← Back link */}
        <S variant="text" height="0.9rem" width="11rem" className="mb-8" />

        {/* Team Header card */}
        <Card className="relative overflow-hidden p-6 sm:p-8 mb-8">
          <div className="relative">
            {/* Team name + leader badge */}
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <S variant="text" height="1.75rem" width="55%" />
              <S height="1.4rem" width="5rem" className="rounded-full" />
            </div>
            {/* Description */}
            <S variant="text" height="1rem" width="80%" className="mb-4" />
            {/* Meta row: members count + created date */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <S variant="text" height="0.85rem" width="6rem" />
              <S variant="text" height="0.85rem" width="9rem" />
            </div>
          </div>
        </Card>

        {/* Team Leader card */}
        <Card className="p-6 mb-6">
          <S variant="text" height="1.4rem" width="8rem" className="mb-4" />
          <div className="flex items-center gap-4 p-4 bg-bg-elevated rounded-lg">
            <S variant="circular" width="3rem" height="3rem" className="shrink-0" />
            <div className="space-y-1.5">
              <S variant="text" height="1rem" width="9rem" />
              <S variant="text" height="0.85rem" width="13rem" />
            </div>
          </div>
        </Card>

        {/* Team Members card */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <S variant="text" height="1.4rem" width="11rem" />
          </div>

          {/* Pending invitations sub-section */}
          <div className="mt-6 mb-6">
            <S variant="text" height="0.85rem" width="10rem" className="mb-3" />
            <div className="space-y-2">
              {[0, 1].map((i) => (
                <div key={i} className="flex items-center justify-between gap-3 p-3 bg-bg-elevated rounded-lg border border-border-default">
                  <div className="flex items-center gap-3 min-w-0">
                    <S variant="circular" width="2rem" height="2rem" className="shrink-0" />
                    <div className="space-y-1 min-w-0">
                      <S variant="text" height="0.9rem" width="55%" />
                      <S variant="text" height="0.75rem" width="70%" />
                    </div>
                  </div>
                  <S height="1.4rem" width="4.5rem" className="rounded-full shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* Members list */}
          <div className="space-y-3 mt-6">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex flex-wrap items-center justify-between gap-3 p-4 bg-bg-elevated rounded-lg">
                <div className="flex items-center gap-4 min-w-0">
                  <S variant="circular" width="2.5rem" height="2.5rem" className="shrink-0" />
                  <div className="space-y-1.5 min-w-0">
                    <S variant="text" height="0.9rem" width="8rem" />
                    <S variant="text" height="0.8rem" width="11rem" />
                  </div>
                </div>
                <S variant="text" height="0.85rem" width="7rem" className="shrink-0" />
              </div>
            ))}
          </div>
        </Card>

        {/* Team Management card (leader only) */}
        <Card className="p-6">
          <S variant="text" height="1.4rem" width="11rem" className="mb-6" />
          <div className="space-y-4">
            {/* Add member form */}
            <div className="space-y-1.5">
              <S variant="text" height="0.85rem" width="8rem" />
              <div className="flex gap-2">
                <S height="2.75rem" className="flex-1" />
                <S height="2.75rem" width="5rem" />
              </div>
            </div>
            {/* Invite by email form */}
            <div className="space-y-1.5">
              <S variant="text" height="0.85rem" width="8rem" />
              <div className="flex gap-2">
                <S height="2.75rem" className="flex-1" />
                <S height="2.75rem" width="5rem" />
              </div>
            </div>
            {/* Danger zone */}
            <div className="pt-4 border-t border-border-default">
              <S height="2.75rem" width="8rem" />
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
}
