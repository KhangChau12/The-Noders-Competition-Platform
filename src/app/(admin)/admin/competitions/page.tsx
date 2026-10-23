import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PageBand, BandFacts } from '@/components/ui/PageBand';
import { buttonClasses } from '@/components/ui/Button';
import DeleteCompetitionButton from './DeleteCompetitionButton';
import { getCompetitionSummaries, splitTitle, type CompetitionSummary } from '@/lib/data/competitions';
import { getNextDeadline } from '@/lib/utils/competition';
import { PHASE_UI } from '@/lib/ui/phase';
import { metricShortName } from '@/lib/constants';
import { vnRange, shortCountdown } from '@/lib/ui/dates';
import { cn } from '@/lib/utils/cn';

// Auth-dependent data must be fresh on every request.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = { title: 'Competitions – Admin' };

export default async function AdminCompetitionsPage() {
  // Auth + role are enforced by the admin layout.
  const supabase = await createClient();
  const [list, { data: regs }, { data: keys }] = await Promise.all([
    getCompetitionSummaries(supabase),
    supabase.from('registrations').select('competition_id, status') as unknown as Promise<{ data: { competition_id: string; status: string }[] | null }>,
    supabase.from('test_datasets').select('competition_id, phase') as unknown as Promise<{ data: { competition_id: string; phase: string }[] | null }>,
  ]);

  const pendingOf = (id: string) => (regs ?? []).filter((r) => r.competition_id === id && r.status === 'pending').length;
  const keysOf = (id: string) => (keys ?? []).filter((k) => k.competition_id === id).map((k) => k.phase);

  const groups: { title: string; items: CompetitionSummary[] }[] = [
    { title: 'Open now', items: list.filter((c) => c.phase === 'registration' || c.phase === 'public_test' || c.phase === 'private_test') },
    { title: 'Coming up', items: list.filter((c) => c.phase === 'upcoming') },
    { title: 'Ended', items: list.filter((c) => c.phase === 'ended') },
  ];

  return (
    <>
      <PageBand
        eyebrow="Admin"
        title="Competitions"
        description="Create contests, upload answer keys and follow how each one is doing."
        aside={
          <Link href="/admin/competitions/create" className={buttonClasses({ variant: 'primary', size: 'lg', className: 'w-full lg:w-auto' })}>
            New competition
          </Link>
        }
      >
        <BandFacts
          facts={[
            { value: list.length, label: 'Competitions' },
            { value: groups[0].items.length, label: 'Open now', color: 'text-blue' },
            { value: list.reduce((n, c) => n + c.participants, 0), label: 'Participants, all contests' },
            { value: list.reduce((n, c) => n + c.submissions, 0), label: 'Submissions' },
          ]}
        />
      </PageBand>

      <div className="shell flex flex-col gap-14 pb-24 pt-12 sm:pt-14">
        {list.length === 0 && (
          <p className="rounded-2xl bg-bg-elevated px-6 py-5 text-text-tertiary">
            No competitions yet.{' '}
            <Link href="/admin/competitions/create" className="link">
              Create the first one
            </Link>
            .
          </p>
        )}
        {groups
          .filter((g) => g.items.length > 0)
          .map((g) => (
            <section key={g.title} aria-label={g.title}>
              <h2 className="h-section mb-5">
                {g.title} <span className="font-mono text-lg font-normal text-text-muted">{g.items.length}</span>
              </h2>
              <ul className="flex flex-col gap-3">
                {g.items.map((c) => {
                  const ui = PHASE_UI[c.phase];
                  const at = getNextDeadline(c, c.phase);
                  const pending = pendingOf(c.id);
                  const k = keysOf(c.id);
                  const missing = [!k.includes('public') && 'public', c.competition_type === '4-phase' && !k.includes('private') && 'private'].filter(Boolean) as string[];
                  return (
                    <li key={c.id} className="flex flex-col gap-4 rounded-[18px] bg-bg-surface p-5 sm:p-6 lg:flex-row lg:items-center lg:gap-8">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                          <span className={cn('inline-flex items-center gap-1.5 font-semibold', ui.text)}>
                            <span className={cn('h-2 w-2 rounded-full', ui.fill)} aria-hidden />
                            {ui.label}
                            {at && c.phase !== 'ended' ? <span className="font-normal text-text-muted"> · {shortCountdown(at)} left</span> : null}
                          </span>
                          <span className="text-text-muted">
                            {c.competition_type} · {c.participation_type} · {metricShortName(c.scoring_metric)}
                          </span>
                        </div>
                        <Link href={`/admin/competitions/${c.id}/edit`} className="block truncate text-lg font-bold text-text-primary hover:underline">
                          {splitTitle(c.title).code ? `${splitTitle(c.title).code}: ${splitTitle(c.title).name}` : c.title}
                        </Link>
                        <p className="mt-1 text-sm text-text-tertiary">{vnRange(c.registration_start, c.private_test_end ?? c.public_test_end)}</p>
                        {c.phase !== 'ended' && missing.length > 0 && <p className="mt-2 text-sm text-amber">Missing {missing.join(' and ')} answer key</p>}
                      </div>
                      <dl className="grid grid-cols-3 gap-2 lg:w-[300px] lg:shrink-0">
                        {[
                          ['Participants', c.participants, ''],
                          ['Submissions', c.submissions, ''],
                          ['Pending', pending, pending > 0 ? 'text-amber' : ''],
                        ].map(([l, v, col]) => (
                          <div key={l as string} className="rounded-xl bg-bg-elevated px-3 py-2.5">
                            <dt className="text-[13px] text-text-muted">{l}</dt>
                            <dd className={cn('font-mono text-lg', col as string)}>{v}</dd>
                          </div>
                        ))}
                      </dl>
                      <div className="flex flex-wrap items-center gap-2 lg:w-[220px] lg:shrink-0 lg:justify-end">
                        <Link href={`/admin/competitions/${c.id}/edit`} className={buttonClasses({ variant: 'secondary', size: 'sm' })}>
                          Edit
                        </Link>
                        <Link href={`/competitions/${c.id}`} className={buttonClasses({ variant: 'ghost', size: 'sm' })}>
                          View ↗
                        </Link>
                        <DeleteCompetitionButton competitionId={c.id} competitionTitle={c.title} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
      </div>
    </>
  );
}
