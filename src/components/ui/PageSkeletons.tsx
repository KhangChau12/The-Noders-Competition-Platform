'use client';

import Skeleton from './Skeleton';
import { Card } from './Card';

// Reusable shimmer block
const S = Skeleton;

// ─── Stat card skeleton (4-up grid) ──────────────────────────────────────────
export function StatCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-2 lg:grid-cols-${count} gap-3 sm:gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="p-3.5 sm:p-5 space-y-2">
          <S height="1.75rem" width="40%" />
          <S variant="text" height="0.75rem" width="60%" />
        </Card>
      ))}
    </div>
  );
}

// ─── Competition card skeleton ────────────────────────────────────────────────
// Mirrors <CompetitionGridCard>: eyebrow line → title (2 lines) + description
// (2 lines) → phase rail + "closes in" line → leader line → footer.
export function CompetitionCardSkeleton() {
  return (
    <div className="h-full flex flex-col gap-3 rounded-xl border border-border-default bg-bg-surface p-4 sm:p-[18px]">
      {/* eyebrow */}
      <S variant="text" height="0.75rem" width="70%" />

      {/* title (2 lines) + description (2 lines) */}
      <div>
        <div className="space-y-1.5 mb-2">
          <S variant="text" height="1.2rem" width="90%" />
          <S variant="text" height="1.2rem" width="55%" />
        </div>
        <div className="space-y-1.5">
          <S variant="text" height="0.85rem" width="100%" />
          <S variant="text" height="0.85rem" width="80%" />
        </div>
      </div>

      {/* phase rail + closes-in line */}
      <div>
        <S height="0.25rem" width="100%" className="rounded-full" />
        <S variant="text" height="0.8rem" width="9rem" className="mt-2.5" />
      </div>

      {/* footer */}
      <div className="mt-auto pt-1 flex items-center justify-between gap-3">
        <S variant="text" height="0.85rem" width="60%" />
        <S variant="text" height="0.75rem" width="3rem" />
      </div>
    </div>
  );
}

// ─── Practice problem card skeleton ──────────────────────────────────────────
// Mirrors <PracticeProblemCard>: 3px top edge accent → difficulty word →
// title (2 lines) → metric line → description (2 lines) → tags line → footer.
export function PracticeProblemCardSkeleton() {
  return (
    <div className="relative h-full flex flex-col gap-3 rounded-xl border border-border-default bg-bg-surface p-4 sm:p-[18px] overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-[3px] before:rounded-t-xl before:bg-border-subtle/70">
      {/* difficulty word */}
      <S variant="text" height="0.75rem" width="6rem" />

      <div>
        <div className="space-y-1.5 mb-1.5">
          <S variant="text" height="1.1rem" width="95%" />
          <S variant="text" height="1.1rem" width="60%" />
        </div>
        <S variant="text" height="0.7rem" width="55%" className="mb-2" />
        <div className="space-y-1.5">
          <S variant="text" height="0.85rem" width="100%" />
          <S variant="text" height="0.85rem" width="75%" />
        </div>
      </div>

      {/* tags line */}
      <S variant="text" height="0.7rem" width="50%" />

      {/* footer */}
      <div className="mt-auto pt-1 flex items-center justify-between gap-3">
        <S variant="text" height="0.85rem" width="55%" />
        <S variant="text" height="0.75rem" width="3.5rem" />
      </div>
    </div>
  );
}

// ─── Dashboard competition row skeleton ──────────────────────────────────────
export function DashboardCompetitionRowSkeleton() {
  return (
    <Card className="p-4 sm:p-6 space-y-3">
      <div className="flex gap-2">
        <S height="1.5rem" width="7rem" className="rounded-full" />
        <S height="1.5rem" width="5rem" className="rounded-full" />
      </div>
      <S variant="text" height="1.4rem" width="70%" />
      <S variant="text" height="0.75rem" width="55%" />
      <S height="0.5rem" width="100%" className="rounded-full" />
      <div className="flex justify-between">
        <S variant="text" height="0.7rem" width="30%" />
        <S variant="text" height="0.7rem" width="30%" />
      </div>
    </Card>
  );
}

// ─── Section heading skeleton ─────────────────────────────────────────────────
// Mirrors <CompetitionSection>'s header: an uppercase label on the left,
// a mono count on the right, aligned along the baseline.
export function SectionHeadingSkeleton({ kicker = false }: { kicker?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <S variant="text" height="0.75rem" width={kicker ? '9rem' : '7rem'} />
      <S variant="text" height="0.75rem" width="6rem" className="shrink-0" />
    </div>
  );
}

// ─── Page header skeleton ─────────────────────────────────────────────────────
export function PageHeaderSkeleton() {
  return (
    <div className="mb-6 sm:mb-10 space-y-2">
      <S variant="text" height="0.7rem" width="12rem" />
      <S variant="text" height="2.75rem" width="16rem" />
      <S variant="text" height="1rem" width="28rem" />
    </div>
  );
}

// ─── Admin table skeleton ─────────────────────────────────────────────────────
export function AdminTableSkeleton({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border-default">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-bg-surface border-b border-border-default">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="px-4 py-3.5">
                <S variant="text" height="0.9rem" width="70%" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r} className="border-b border-border-default/50">
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c} className="px-4 py-3.5">
                  <S variant="text" height="0.9rem" width={c === 0 ? '80%' : '60%'} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Sidebar team card skeleton ───────────────────────────────────────────────
export function SidebarTeamSkeleton() {
  return (
    <Card className="p-5 sm:p-6 space-y-4">
      <S variant="text" height="1.4rem" width="8rem" />
      <div className="space-y-3">
        {[0, 1].map((i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <div className="space-y-1.5 flex-1">
              <S variant="text" height="1rem" width="60%" />
              <S variant="text" height="0.75rem" width="40%" />
            </div>
            <S height="2rem" width="4rem" />
          </div>
        ))}
      </div>
    </Card>
  );
}
