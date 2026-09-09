import Skeleton from '@/components/ui/Skeleton';

const S = Skeleton;

// Shown during client-side navigation to "/". Mirrors the homepage shell:
// hero (text column + constellation area) → stats strip → competitions grid.
export default function HomeLoading() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative lg:min-h-[90vh] flex items-center overflow-hidden py-10 sm:py-16 lg:py-24">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary-blue/20 rounded-full blur-[120px] pointer-events-none opacity-60" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-accent-cyan/20 rounded-full blur-[120px] pointer-events-none opacity-60" />

        <div className="container mx-auto px-4 sm:px-6 grid lg:grid-cols-2 gap-8 items-center relative z-10">
          {/* Left column */}
          <div className="mx-auto lg:mx-0 max-w-2xl w-full space-y-4">
            <div className="space-y-2">
              <S variant="text" height="2.75rem" width="70%" />
              <S variant="text" height="2.75rem" width="90%" />
            </div>
            <div className="space-y-1.5">
              <S variant="text" height="1rem" width="100%" />
              <S variant="text" height="1rem" width="80%" />
            </div>
            <div className="flex gap-3 pt-1">
              <S height="3rem" width="12rem" className="rounded-lg" />
              <S height="3rem" width="10rem" className="rounded-lg" />
            </div>
          </div>

          {/* Constellation area */}
          <div className="relative h-[400px] lg:h-[500px] w-full hidden lg:block">
            <S height="100%" width="100%" className="rounded-xl opacity-60" />
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="px-4 sm:px-6 py-10 sm:py-14 bg-bg-surface/40">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center gap-2 mb-8 sm:mb-10">
            <S variant="text" height="0.75rem" width="8rem" />
            <S variant="text" height="2rem" width="16rem" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl sm:rounded-2xl border border-border-default bg-bg-surface p-4 sm:p-5 space-y-2">
                <S variant="text" height="2rem" width="40%" />
                <S variant="text" height="0.7rem" width="60%" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Competitions grid */}
      <section className="px-4 sm:px-6 py-10 sm:py-14">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center gap-2 mb-6 sm:mb-8">
            <S variant="text" height="2rem" width="14rem" />
            <S variant="text" height="1rem" width="20rem" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-full flex flex-col gap-3 rounded-xl border border-border-default bg-bg-surface p-4 sm:p-[18px]">
                <S variant="text" height="0.75rem" width="60%" />
                <div className="space-y-1.5">
                  <S variant="text" height="1.2rem" width="85%" />
                  <S variant="text" height="0.85rem" width="100%" />
                  <S variant="text" height="0.85rem" width="70%" />
                </div>
                <S height="0.25rem" width="100%" className="rounded-full mt-1" />
                <div className="mt-auto pt-1 flex justify-between">
                  <S variant="text" height="0.85rem" width="50%" />
                  <S variant="text" height="0.75rem" width="3rem" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
