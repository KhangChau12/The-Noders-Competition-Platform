import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PageBand } from '@/components/ui/PageBand';
import { buttonClasses } from '@/components/ui/Button';
import { getPracticeSummaries } from '@/lib/data/practice';
import ProgressRing from '@/components/practice/ProgressRing';
import PracticeBrowser from './PracticeBrowser';

export const metadata = { title: 'Practice – The Noders Platform' };

export default async function PracticePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const problems = await getPracticeSummaries(supabase, user?.id);
  const tried = problems.filter((p) => p.yourBest !== null).length;
  const starter = [...problems].sort((a, b) => b.solvers - a.solvers)[0];

  return (
    <>
      <PageBand
        eyebrow="The Noders Platform"
        title="Practice"
        description="Open problems scored like contests, with no deadline."
        aside={
          user ? (
            <div className="flex items-center gap-5 rounded-2xl bg-teal-strong p-6 shadow-lift">
              <ProgressRing done={tried} total={problems.length} />
              <div className="min-w-0">
                <p className="text-sm text-teal-soft">Your progress</p>
                <p className="text-lg font-bold leading-snug">
                  {tried === 0 ? 'No problem tried yet.' : tried === problems.length ? 'You have tried them all.' : `${tried} of ${problems.length} tried.`}
                </p>
                {starter && tried < problems.length && (
                  <Link href={`/practice/${starter.id}`} className="mt-1 inline-block text-[15px] font-semibold text-white hover:underline">
                    {tried === 0 ? `Start with ${starter.title} →` : 'Pick the next one below'}
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 rounded-2xl bg-navy-deep p-6">
              <p className="text-lg font-bold">Anyone can read the problems.</p>
              <p className="text-[15px] text-navy-text">Sign in to submit, track your progress and appear on the leaderboards.</p>
              <Link href="/login?redirect=/practice" className={buttonClasses({ className: 'w-fit bg-white text-navy-deep' })}>
                Sign in
              </Link>
            </div>
          )
        }
      />

      <section data-reveal className="shell pb-24 pt-12 sm:pb-28 sm:pt-14">
        <PracticeBrowser problems={problems} signedIn={!!user} />
      </section>
    </>
  );
}
