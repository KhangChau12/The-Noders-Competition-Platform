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
export function CompetitionCardSkeleton() {
  return (
    <Card className="p-4 sm:p-6 space-y-4">
      {/* badges row */}
      <div className="flex gap-2">
        <S height="1.5rem" width="7rem" className="rounded-full" />
        <S height="1.5rem" width="5rem" className="rounded-full" />
      </div>
      {/* title */}
      <div className="space-y-2">
        <S variant="text" height="1.4rem" width="80%" />
        <S variant="text" height="0.9rem" width="100%" />
        <S variant="text" height="0.9rem" width="75%" />
      </div>
      {/* progress bar */}
      <S height="0.375rem" width="100%" className="rounded-full" />
      {/* meta row */}
      <div className="flex justify-between">
        <S variant="text" height="0.75rem" width="45%" />
        <S variant="text" height="0.75rem" width="20%" />
      </div>
    </Card>
  );
}

// ─── Spotlight card skeleton ──────────────────────────────────────────────────
export function SpotlightCardSkeleton() {
  return (
    <Card className="p-5 sm:p-8">
      <div className="grid lg:grid-cols-[1fr_300px] gap-6 lg:gap-10">
        <div className="space-y-4">
          <div className="flex gap-2">
            <S height="1.5rem" width="8rem" className="rounded-full" />
            <S height="1.5rem" width="5rem" className="rounded-full" />
          </div>
          <S variant="text" height="2rem" width="85%" />
          <S variant="text" height="0.9rem" width="100%" />
          <S variant="text" height="0.9rem" width="90%" />
          <S variant="text" height="0.75rem" width="55%" />
        </div>
        <div className="bg-bg-elevated/60 border border-border-subtle/50 rounded-xl p-4 sm:p-5 space-y-4">
          <S variant="text" height="0.75rem" width="70%" className="mx-auto" />
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-1 text-center">
                <S height="2rem" width="100%" />
                <S variant="text" height="0.7rem" width="60%" className="mx-auto" />
              </div>
            ))}
          </div>
          <S height="2.5rem" width="100%" />
        </div>
      </div>
    </Card>
  );
}

// ─── Practice problem card skeleton ──────────────────────────────────────────
export function PracticeProblemCardSkeleton() {
  return (
    <Card className="p-4 sm:p-5 space-y-3">
      <div className="flex gap-2">
        <S height="1.5rem" width="5rem" className="rounded-full" />
        <S height="1.5rem" width="4rem" className="rounded-full" />
      </div>
      <S variant="text" height="1.25rem" width="75%" />
      <S variant="text" height="0.85rem" width="100%" />
      <S variant="text" height="0.85rem" width="85%" />
      <div className="flex justify-between pt-1">
        <S variant="text" height="0.75rem" width="40%" />
        <S variant="text" height="0.75rem" width="20%" />
      </div>
    </Card>
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
export function SectionHeadingSkeleton({ kicker = false }: { kicker?: boolean }) {
  return (
    <div className="space-y-1.5 mb-5">
      {kicker && <S variant="text" height="0.7rem" width="12rem" />}
      <S variant="text" height="1.6rem" width="18rem" />
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
