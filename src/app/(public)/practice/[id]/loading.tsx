import Skeleton from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';

const S = Skeleton;

// Mirrors src/app/(public)/practice/[id]/page.tsx + PracticeTabs.tsx:
//   header (breadcrumb, difficulty + tag pills, big title, description,
//   inline quick-stats row) then a 3-col grid — tab nav + "Problem Statement"
//   card on the left (col-span-2), CTA / "At a Glance" / "Top Participants"
//   cards in the sidebar. Sidebar renders first on mobile (order-1).
export default function PracticeDetailLoading() {
  return (
    <div className="min-h-screen">

      {/* ── Hero header ── */}
      <div className="px-4 sm:px-6 pt-8 pb-6 sm:pt-10 sm:pb-8">
        <div className="max-w-7xl mx-auto">

          {/* ← Practice breadcrumb */}
          <S variant="text" height="0.9rem" width="5rem" className="mb-5" />

          {/* difficulty pill + tag pills */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <S height="1.375rem" width="5.5rem" className="rounded-full" />
            <S height="1.375rem" width="6rem" className="rounded-full" />
            <S height="1.375rem" width="4.5rem" className="rounded-full" />
          </div>

          {/* title — font-brand text-3xl sm:text-4xl lg:text-5xl */}
          <S variant="text" height="2.5rem" width="60%" className="mb-3 max-w-full" />

          {/* description (2 lines, max-w-3xl) */}
          <div className="space-y-1.5 mb-5 max-w-3xl">
            <S variant="text" height="1rem" width="100%" />
            <S variant="text" height="1rem" width="70%" />
          </div>

          {/* quick stats row — 3 inline icon + text items */}
          <div className="flex items-center gap-4 sm:gap-6">
            <S variant="text" height="0.9rem" width="7rem" />
            <S variant="text" height="0.9rem" width="6rem" />
            <S variant="text" height="0.9rem" width="8rem" />
          </div>
        </div>
      </div>

      {/* ── Main body ── */}
      <div className="px-4 sm:px-6 pb-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">

            {/* Left / main — 2 cols on lg, second on mobile */}
            <div className="lg:col-span-2 min-w-0 order-2 lg:order-1">

              {/* tab nav — 3 items with icon, along a bottom border */}
              <div className="flex border-b border-border-default mb-5 sm:mb-6 gap-2 sm:gap-4">
                {['6.5rem', '9rem', '8rem'].map((w, i) => (
                  <div key={i} className="flex items-center gap-1.5 py-3.5 shrink-0">
                    <S height="1rem" width="1rem" className="rounded" />
                    <S variant="text" height="0.9rem" width={w} />
                  </div>
                ))}
              </div>

              {/* Overview tab — "Problem Statement" card */}
              <Card className="p-4 sm:p-6 min-w-0">
                <S variant="text" height="1.4rem" width="12rem" className="mb-4" />
                <div className="space-y-2">
                  {['100%', '96%', '90%', '100%', '85%', '70%'].map((w, i) => (
                    <S key={i} variant="text" height="0.95rem" width={w} />
                  ))}
                </div>
              </Card>
            </div>

            {/* Sidebar — first on mobile, right col on lg */}
            <div className="space-y-4 sm:space-y-5 self-start min-w-0 order-1 lg:order-2">

              {/* "Ready to practice?" CTA */}
              <Card className="p-4 sm:p-5 bg-primary-blue/5 border-primary-blue/20">
                <S variant="text" height="0.95rem" width="9rem" className="mb-2" />
                <div className="space-y-1.5 mb-3">
                  <S variant="text" height="0.8rem" width="100%" />
                  <S variant="text" height="0.8rem" width="80%" />
                </div>
                <S height="2.25rem" width="100%" className="rounded-lg" />
              </Card>

              {/* "At a Glance" */}
              <Card className="p-4 sm:p-5">
                <S variant="text" height="0.7rem" width="6rem" className="mb-4" />
                <div className="space-y-3">
                  {[0, 1].map((i) => (
                    <div
                      key={i}
                      className="p-3 bg-bg-elevated rounded-xl border border-border-default space-y-1.5"
                    >
                      <S variant="text" height="0.7rem" width="45%" />
                      <S variant="text" height="0.95rem" width="60%" />
                      <S variant="text" height="0.7rem" width="70%" />
                    </div>
                  ))}
                </div>
                <div className="mt-3 space-y-2 border-t border-border-default pt-3">
                  {[0, 1].map((i) => (
                    <div key={i} className="flex items-center justify-between gap-3">
                      <S variant="text" height="0.85rem" width="30%" />
                      <S variant="text" height="0.85rem" width="20%" />
                    </div>
                  ))}
                </div>
              </Card>

              {/* "Top Participants" — 5 rows */}
              <Card className="p-4 sm:p-5">
                <S variant="text" height="0.7rem" width="8rem" className="mb-4" />
                <div className="space-y-2">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-border-default bg-bg-elevated"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <S variant="text" height="0.85rem" width="1.5rem" />
                        <S variant="text" height="0.85rem" width="6rem" />
                      </div>
                      <S variant="text" height="0.85rem" width="3rem" />
                    </div>
                  ))}
                </div>
              </Card>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
