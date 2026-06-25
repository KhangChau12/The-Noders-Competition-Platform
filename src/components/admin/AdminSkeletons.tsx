'use client';

import Skeleton from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';

const S = Skeleton;

/**
 * Skeletons that mirror the real admin page DOM (post-redesign) so the loading
 * state visually matches what renders once data arrives. All of these assume the
 * admin shell already provides page padding + max-width, so they render bare.
 */

/** AdminPageHeader placeholder: title + description + (optional) action button(s). */
export function AdminHeaderSkeleton({ actions = 1 }: { actions?: number }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6 sm:mb-8">
      <div className="space-y-2 min-w-0">
        <S variant="text" height="2rem" width="13rem" />
        <S variant="text" height="0.95rem" width="18rem" className="max-w-full" />
      </div>
      {actions > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 shrink-0">
          {Array.from({ length: actions }).map((_, i) => (
            <S key={i} height="2.75rem" width="10rem" className="w-full sm:w-40" />
          ))}
        </div>
      )}
    </div>
  );
}

/** StatCard grid placeholder. */
export function StatGridSkeleton({ count = 4 }: { count?: number }) {
  const cols = count === 5 ? 'lg:grid-cols-5' : count === 3 ? 'grid-cols-3' : 'lg:grid-cols-4';
  const base = count === 3 ? 'grid-cols-3' : 'grid-cols-2';
  return (
    <div className={`grid ${base} ${cols} gap-3 sm:gap-4 mb-8 sm:mb-10`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border-default bg-bg-surface p-4 sm:p-5 space-y-1.5">
          <S variant="text" height="1.75rem" width="3.5rem" />
          <S variant="text" height="0.7rem" width="70%" />
          <S variant="text" height="0.6rem" width="55%" />
        </div>
      ))}
    </div>
  );
}

/** Section title placeholder. */
function SectionTitle({ width = '12rem' }: { width?: string }) {
  return <S variant="text" height="1.3rem" width={width} className="mb-4" />;
}

/**
 * Admin "list card" — the panel used by Competitions / Practice list pages where
 * each item is a stacked row (title + badges + meta + actions), not a table.
 */
export function AdminListCardSkeleton({
  rows = 5,
  title = '14rem',
}: {
  rows?: number;
  title?: string;
}) {
  return (
    <Card className="hover:translate-y-0 hover:border-border-default overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-border-default bg-bg-elevated">
        <S variant="text" height="1.25rem" width={title} />
      </div>
      <div className="divide-y divide-border-default">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
              <div className="flex-1 min-w-0 space-y-3">
                {/* title + badges */}
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                  <S variant="text" height="1.3rem" width="11rem" />
                  <S height="1.4rem" width="5rem" className="rounded-full" />
                  <S height="1.4rem" width="4.5rem" className="rounded-full" />
                </div>
                {/* description */}
                <S variant="text" height="0.85rem" width="90%" />
                {/* meta row */}
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  <S variant="text" height="0.85rem" width="7rem" />
                  <S variant="text" height="0.85rem" width="6rem" />
                  <S variant="text" height="0.85rem" width="8rem" />
                </div>
              </div>
              {/* actions: full-width on mobile, stacked column on desktop */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-col gap-2 shrink-0 lg:w-44">
                <S height="2.75rem" className="w-full" />
                <S height="2.75rem" className="w-full" />
                <S height="2.75rem" className="w-full col-span-2 sm:col-span-1" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/** Dashboard pending-registration card list placeholder. */
function PendingRegistrationsSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <section className="mb-8 sm:mb-10">
      <SectionTitle width="13rem" />
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <Card key={i} className="hover:translate-y-0 hover:border-border-default p-4 sm:p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <S variant="text" height="1.1rem" width="9rem" />
                  <S height="1.3rem" width="4.5rem" className="rounded-full" />
                </div>
                <S variant="text" height="0.8rem" width="75%" />
              </div>
              <div className="flex gap-2 shrink-0">
                <S height="2.75rem" width="6.5rem" className="flex-1 md:flex-none" />
                <S height="2.75rem" width="6.5rem" className="flex-1 md:flex-none" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

/** A two-column dashboard panel (live competitions / recent submissions). */
function DashboardPanelSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <Card className="hover:translate-y-0 hover:border-border-default p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3 mb-5">
        <S variant="text" height="1.2rem" width="9rem" />
        <S variant="text" height="0.8rem" width="4rem" />
      </div>
      <div className="divide-y divide-border-default">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
            <div className="space-y-1.5 flex-1 min-w-0">
              <S variant="text" height="0.9rem" width="60%" />
              <S variant="text" height="0.7rem" width="40%" />
            </div>
            <S height="1.4rem" width="5rem" className="rounded-full shrink-0" />
          </div>
        ))}
      </div>
    </Card>
  );
}

/** Full dashboard loading state. */
export function DashboardSkeleton() {
  return (
    <>
      <AdminHeaderSkeleton actions={1} />
      <StatGridSkeleton count={5} />
      <PendingRegistrationsSkeleton rows={2} />
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <DashboardPanelSkeleton rows={4} />
        <DashboardPanelSkeleton rows={4} />
      </div>
    </>
  );
}

/** Certificates-by-competition list placeholder (links with chevron). */
export function CertificatesByCompetitionSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Card className="hover:translate-y-0 hover:border-border-default overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-border-default bg-bg-elevated">
        <S variant="text" height="1.25rem" width="16rem" />
      </div>
      <div className="divide-y divide-border-default">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 sm:p-6 flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-3">
                <S variant="text" height="1.1rem" width="50%" />
                <S height="1.4rem" width="5rem" className="rounded-full" />
              </div>
              <S variant="text" height="0.8rem" width="8rem" />
            </div>
            <S height="1.4rem" width="6rem" className="rounded-full shrink-0" />
          </div>
        ))}
      </div>
    </Card>
  );
}

/** Certificate rows for a single competition (icon + info + actions). */
export function CertificateRowsSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <Card className="hover:translate-y-0 hover:border-border-default overflow-hidden">
      {/* search bar */}
      <div className="p-4 border-b border-border-default bg-bg-elevated">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <S height="2.75rem" className="flex-1 rounded-lg" />
          <S variant="text" height="0.85rem" width="9rem" className="shrink-0" />
        </div>
      </div>
      <div className="divide-y divide-border-default">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
              <S variant="rectangular" width="2.5rem" height="2.5rem" className="rounded-lg shrink-0" />
              <div className="flex-1 min-w-0 space-y-1.5">
                <S variant="text" height="1rem" width="55%" />
                <S variant="text" height="0.8rem" width="70%" />
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <S height="2.75rem" width="3rem" className="rounded-lg" />
              <S height="2.75rem" width="3rem" className="rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/** Form page placeholder (create/edit competition & practice). */
export function AdminFormSkeleton({ sections = 3 }: { sections?: number }) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 sm:mb-8 space-y-2">
        <S variant="text" height="2rem" width="14rem" />
        <S variant="text" height="0.95rem" width="16rem" className="max-w-full" />
      </div>
      <div className="space-y-6">
        {Array.from({ length: sections }).map((_, i) => (
          <Card key={i} className="hover:translate-y-0 hover:border-border-default p-5 sm:p-8 space-y-5">
            <S variant="text" height="1.5rem" width="11rem" />
            <div className="space-y-2">
              <S variant="text" height="0.85rem" width="8rem" />
              <S height="2.75rem" className="w-full rounded-lg" />
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <S variant="text" height="0.85rem" width="7rem" />
                <S height="2.75rem" className="w-full rounded-lg" />
              </div>
              <div className="space-y-2">
                <S variant="text" height="0.85rem" width="7rem" />
                <S height="2.75rem" className="w-full rounded-lg" />
              </div>
            </div>
          </Card>
        ))}
        <div className="flex flex-col sm:flex-row gap-3">
          <S height="3rem" className="flex-1 rounded-lg" />
          <S height="3rem" width="8rem" className="rounded-lg" />
        </div>
      </div>
    </div>
  );
}
