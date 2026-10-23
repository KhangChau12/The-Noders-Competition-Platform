import Link from 'next/link';
import { PageBand } from '@/components/ui/PageBand';
import { buttonClasses } from '@/components/ui/Button';
import { SCORING_METRIC_INFO, DEFAULT_SUBMISSION_LIMITS, DEFAULT_PRACTICE_LIMITS } from '@/lib/constants';
import { cn } from '@/lib/utils/cn';

export const metadata = {
  title: 'Guide – The Noders Platform',
  description: 'How contests, submissions, scoring, leaderboards and teams work on The Noders Platform.',
};

const SECTIONS = [
  { id: 'start', label: 'Getting started' },
  { id: 'phases', label: 'Contest phases' },
  { id: 'csv', label: 'The CSV file' },
  { id: 'scoring', label: 'Scoring' },
  { id: 'limits', label: 'Limits' },
  { id: 'board', label: 'Leaderboards' },
  { id: 'teams', label: 'Teams' },
  { id: 'certs', label: 'Certificates' },
] as const;

const METRIC_NOTE: Record<string, string> = {
  f1_score: 'Balances precision and recall. Common when classes are uneven.',
  accuracy: 'Share of rows you predicted correctly.',
  precision: 'Of the rows you labelled positive, how many really are.',
  recall: 'Of the truly positive rows, how many you found.',
  mae: 'Average absolute distance between your number and the true one.',
  rmse: 'Like MAE, but big misses cost more.',
};

function Section({ id, title, children, className }: { id: string; title: string; children: React.ReactNode; className?: string }) {
  return (
    <section data-reveal id={id} aria-labelledby={`${id}-h`} className={cn('scroll-mt-[140px] lg:scroll-mt-[100px]', className)}>
      <h2 id={`${id}-h`} className="h-section mb-5">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function GuidePage() {
  return (
    <>
      <PageBand eyebrow="Help" title="Platform guide" description="Contest phases, submission format, scoring and leaderboard rules." />

      {/* Phone: horizontal section chips. Desktop uses the sticky side list. */}
      <nav aria-label="Sections" className="sticky top-[65px] z-20 border-b border-border-default bg-bg-primary/95 backdrop-blur lg:hidden">
        <ol className="shell scrollbar-none flex gap-2 overflow-x-auto py-3">
          {SECTIONS.map((s) => (
            <li key={s.id} className="shrink-0">
              <a href={`#${s.id}`} className="inline-flex min-h-[40px] items-center rounded-full bg-bg-surface px-4 text-sm text-text-secondary">
                {s.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="shell pb-24 pt-12 sm:pb-28 sm:pt-14">
        <div className="flex flex-col gap-14 lg:flex-row lg:items-start lg:gap-14">
          <nav aria-label="Sections" className="hidden lg:sticky lg:top-[100px] lg:block lg:w-[220px] lg:shrink-0">
            <ol className="flex flex-col gap-1 text-sm">
              {SECTIONS.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="flex gap-2.5 rounded-lg px-3 py-2 text-text-tertiary hover:bg-white/[0.04] hover:text-white">
                    <span className="font-mono text-text-muted">{i + 1}</span>
                    {s.label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="flex min-w-0 max-w-[860px] flex-1 flex-col gap-16 sm:gap-20">
            <Section id="start" title="Getting started">
              <ol data-reveal-group className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {[
                  ['bg-teal-bg', 'text-teal', 'Create an account', 'Use your real name. It appears on leaderboards.'],
                  ['bg-teal-bg', 'text-teal', 'Try a practice problem', 'No deadline, nothing at stake. Learn how uploading works.'],
                  ['bg-amber-bg', 'text-amber', 'Join or create a team', 'Only for team contests. Individual contests don’t need one.'],
                  ['bg-violet-bg', 'text-violet', 'Register for a contest', 'An organiser approves it. Then a Submit button appears.'],
                ].map(([bg, c, t, d], i) => (
                  <li key={t} className={cn('flex flex-col gap-1.5 rounded-2xl p-5', bg)}>
                    <span className={cn('font-mono text-[13px]', c)}>{String(i + 1).padStart(2, '0')}</span>
                    <span className="text-lg font-bold">{t}</span>
                    <span className="text-[15px] text-text-secondary">{d}</span>
                  </li>
                ))}
              </ol>
            </Section>

            <Section id="phases" title="Contest phases">
              <p className="mb-5 max-w-[680px] text-[15px] text-text-secondary sm:text-base">
                A contest moves through its phases on fixed dates, shown on the contest page. Times are Vietnam time (UTC+7). Some contests have three phases, some have four.
              </p>
              <ol className="flex flex-col gap-2.5">
                {[
                  ['bg-violet-bg', 'text-violet', 'Registration', 'Individuals or team leaders register. Submissions are not yet open.'],
                  ['bg-blue-bg', 'text-blue', 'Public test', 'Submissions are scored within seconds on part of the test set.'],
                  ['bg-amber-bg', 'text-amber', 'Private test (4-phase only)', 'A final round on an unseen test set. It decides the final ranking.'],
                  ['bg-teal-bg', 'text-teal', 'Ended', 'Submissions close. Final rankings are published and certificates issued.'],
                ].map(([bg, c, t, d]) => (
                  <li key={t} className={cn('flex flex-col gap-1 rounded-2xl px-5 py-4 sm:flex-row sm:gap-6', bg)}>
                    <span className={cn('font-semibold sm:w-[200px] sm:shrink-0', c)}>{t}</span>
                    <span className="text-[15px] text-text-secondary">{d}</span>
                  </li>
                ))}
              </ol>
            </Section>

            <Section id="csv" title="The CSV file">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                <div className="flex min-w-0 flex-1 flex-col gap-3 text-[15px] text-text-secondary sm:text-base">
                  <p>Every submission is one CSV file with exactly two columns:</p>
                  <ul className="flex flex-col gap-1.5 pl-5 [&>li]:list-disc">
                    <li>
                      <span className="font-mono text-text-primary">id</span>: the id of each test row, exactly as in the test data
                    </li>
                    <li>
                      <span className="font-mono text-text-primary">prediction</span>: your answer for that row
                    </li>
                  </ul>
                  <p>One row per test id, with no duplicates or blank values. The submit page validates the file before uploading.</p>
                  <p>Files that fail validation are marked Rejected with the reason and do not count toward the daily limit.</p>
                </div>
                <pre className="w-full overflow-x-auto rounded-2xl bg-bg-surface p-5 font-mono text-sm leading-relaxed text-text-secondary lg:w-[260px] lg:shrink-0">
                  <span className="text-blue">id,prediction</span>
                  {'\n'}1001,positive{'\n'}1002,negative{'\n'}1003,positive{'\n'}…
                </pre>
              </div>
            </Section>

            <Section id="scoring" title="Scoring">
              <p className="mb-5 max-w-[680px] text-[15px] text-text-secondary sm:text-base">Each contest uses one metric, named on its page. Scores show four decimals.</p>
              <div className="overflow-x-auto rounded-2xl bg-bg-surface">
                <table className="w-full min-w-[560px] text-left text-[15px]">
                  <thead className="bg-bg-elevated text-sm text-text-tertiary">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Metric</th>
                      <th className="px-5 py-3 font-semibold">Better</th>
                      <th className="px-5 py-3 font-semibold">What it measures</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-default">
                    {Object.entries(SCORING_METRIC_INFO).map(([k, m]) => (
                      <tr key={k}>
                        <td className="whitespace-nowrap px-5 py-3 font-semibold">{m.name}</td>
                        <td className={cn('whitespace-nowrap px-5 py-3', m.higher_is_better ? 'text-teal' : 'text-amber')}>{m.higher_is_better ? 'Higher ↑' : 'Lower ↓'}</td>
                        <td className="px-5 py-3 text-text-secondary">{METRIC_NOTE[k]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section id="limits" title="Limits">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  ['Per day', `${DEFAULT_SUBMISSION_LIMITS.DAILY} valid submissions in a contest, ${DEFAULT_PRACTICE_LIMITS.DAILY} in practice, unless the page says otherwise.`],
                  ['Reset', 'Every day at midnight, Vietnam time. The submit page shows a countdown.'],
                  ['File size', `Up to ${DEFAULT_SUBMISSION_LIMITS.MAX_FILE_SIZE_MB} MB by default. Each contest can set its own.`],
                ].map(([t, d]) => (
                  <div key={t} className="flex flex-col gap-1.5 rounded-2xl bg-bg-surface p-5">
                    <span className="text-[13px] font-semibold text-blue">{t}</span>
                    <span className="text-[15px] text-text-secondary">{d}</span>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-[15px] text-text-tertiary">Some contests also cap total submissions. In team contests, limits are shared by the team.</p>
            </Section>

            <Section id="board" title="Leaderboards">
              <ul className="flex flex-col gap-2.5 text-[15px] text-text-secondary sm:text-base">
                {[
                  'Only the best valid score counts.',
                  'Ties are broken by the earliest submission.',
                  'In 4-phase contests the public and private tests have their own boards.',
                  'In 4-phase contests, the final ranking averages the best public and best private scores. Entries with both scores rank first.',
                  'Team contests have both a team board and an individual board.',
                ].map((t, i) => (
                  <li key={i} className="flex gap-3 rounded-xl bg-bg-surface px-5 py-3.5">
                    <span className="font-mono text-[13px] text-blue">{String(i + 1).padStart(2, '0')}</span>
                    {t}
                  </li>
                ))}
              </ul>
            </Section>

            <Section id="teams" title="Teams">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="flex flex-col gap-2 rounded-2xl bg-amber-bg p-5 text-[15px] text-text-secondary">
                  <span className="text-[13px] font-semibold text-amber">Leader</span>
                  Creates the team, invites members by email, registers the team for contests, edits and deletes it.
                </div>
                <div className="flex flex-col gap-2 rounded-2xl bg-teal-bg p-5 text-[15px] text-text-secondary">
                  <span className="text-[13px] font-semibold text-teal">Member</span>
                  Accepts an invitation from the dashboard or the Teams page. Can submit for the team once it’s approved.
                </div>
              </div>
              <p className="mt-4 text-[15px] text-text-tertiary">A person may join several teams, but only one team per contest.</p>
            </Section>

            <Section id="certs" title="Certificates">
              <div className="flex flex-col gap-4 rounded-[20px] bg-teal-bg p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
                <p className="max-w-[520px] text-[15px] text-text-secondary sm:text-base">
                  After a contest ends, organisers issue certificates. Each carries a code such as <span className="font-mono text-text-primary">PAIC-2026-X7K9</span> that anyone can check.
                </p>
                <Link href="/verify" className={buttonClasses({ variant: 'accent', tone: 'teal', className: 'self-start sm:self-auto' })}>
                  Verify a certificate
                </Link>
              </div>
            </Section>

            <div className="flex flex-col gap-4 rounded-[20px] bg-navy p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-8">
              <span>
                <span className="block text-xl font-bold">Get started</span>
                <span className="text-navy-text">Practice problems are the quickest way to try the full workflow.</span>
              </span>
              <span className="flex flex-wrap gap-2.5">
                <Link href="/practice" className={buttonClasses({ variant: 'primary' })}>
                  Try practice
                </Link>
                <Link href="/competitions" className={buttonClasses({ variant: 'outline', className: 'border-white/30' })}>
                  Competitions
                </Link>
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
