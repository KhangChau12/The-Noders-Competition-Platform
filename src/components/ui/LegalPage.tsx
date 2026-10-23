import Link from 'next/link';
import { PageBand } from '@/components/ui/PageBand';

export interface LegalSection {
  title: string;
  body: React.ReactNode;
}

/** Shared layout for Privacy / Terms: navy band, numbered sections on a single text column. */
export function LegalPage({ title, updated, sections, other }: { title: string; updated: string; sections: LegalSection[]; other: { href: string; label: string } }) {
  return (
    <>
      <PageBand narrow eyebrow="Legal" title={title} description={`Last updated ${updated}.`} />
      <div className="shell-narrow pb-24 pt-12 sm:pb-28 sm:pt-14">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-14">
          <nav aria-label="Sections" className="hidden lg:sticky lg:top-[100px] lg:block lg:w-[220px] lg:shrink-0">
            <ol className="flex flex-col gap-1 text-sm">
              {sections.map((s, i) => (
                <li key={s.title}>
                  <a href={`#s${i + 1}`} className="flex gap-2.5 rounded-lg px-3 py-2 text-text-tertiary hover:bg-white/[0.04] hover:text-white">
                    <span className="font-mono text-text-muted">{i + 1}</span>
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <div className="flex min-w-0 max-w-[720px] flex-1 flex-col gap-4">
            {sections.map((s, i) => (
              <section key={s.title} id={`s${i + 1}`} className="scroll-mt-[100px] rounded-[18px] bg-bg-surface p-6 sm:p-8">
                <h2 className="h-card mb-3 flex items-baseline gap-3">
                  <span className="font-mono text-base text-blue">{i + 1}</span>
                  {s.title}
                </h2>
                <div className="flex flex-col gap-3 text-[15px] leading-relaxed text-text-secondary sm:text-base [&_li]:ml-5 [&_li]:list-disc [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5">{s.body}</div>
              </section>
            ))}
            <p className="mt-2 text-sm text-text-muted">
              See also{' '}
              <Link href={other.href} className="link">
                {other.label}
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export const CONTACT = (
  <a href="mailto:phuckhangtdn@gmail.com" className="link">
    phuckhangtdn@gmail.com
  </a>
);
