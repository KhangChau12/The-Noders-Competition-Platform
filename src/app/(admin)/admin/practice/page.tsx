import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PageBand, BandFacts } from '@/components/ui/PageBand';
import { buttonClasses } from '@/components/ui/Button';
import DeletePracticeProblemButton from './DeletePracticeProblemButton';
import { metricShortName, PRACTICE_DIFFICULTY_INFO } from '@/lib/constants';
import { domainFromTags, DOMAIN_UI } from '@/lib/ui/phase';
import { cn } from '@/lib/utils/cn';

export const metadata = { title: 'Practice – Admin' };

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminPracticePage() {
  // Auth + role are enforced by the admin layout.
  const supabase = await createClient();
  const [{ data: problems }, { data: counts }, { data: keys }] = (await Promise.all([
    supabase
      .from('practice_problems')
      .select('id, title, description, scoring_metric, difficulty, created_at, practice_problem_tags(practice_tags(id, name, slug))')
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
    supabase.from('practice_problem_submission_counts').select('problem_id, participant_count, valid_submission_count'),
    supabase.from('practice_test_datasets').select('problem_id'),
  ])) as [{ data: any[] | null }, { data: { problem_id: string; participant_count: number; valid_submission_count: number }[] | null }, { data: { problem_id: string }[] | null }];

  const countOf = (id: string) => (counts ?? []).find((c) => c.problem_id === id);
  const hasKey = (id: string) => (keys ?? []).some((k) => k.problem_id === id);
  const list = problems ?? [];

  return (
    <>
      <PageBand
        eyebrow="Admin"
        title="Practice problems"
        description="Problems with no deadline. Tags decide which domain group a problem shows in."
        aside={
          <div className="flex flex-col gap-2.5 sm:flex-row lg:flex-col">
            <Link href="/admin/practice/create" className={buttonClasses({ variant: 'primary', size: 'lg', className: 'w-full' })}>
              New problem
            </Link>
            <Link href="/admin/practice/tags" className={buttonClasses({ variant: 'outline', size: 'lg', className: 'w-full border-white/25' })}>
              Manage tags
            </Link>
          </div>
        }
      >
        <BandFacts
          facts={[
            { value: list.length, label: 'Problems' },
            { value: (counts ?? []).reduce((n, c) => n + (c.participant_count ?? 0), 0), label: 'Solvers, all problems', color: 'text-teal' },
            { value: (counts ?? []).reduce((n, c) => n + (c.valid_submission_count ?? 0), 0), label: 'Valid submissions' },
          ]}
        />
      </PageBand>

      <div className="shell pb-24 pt-12 sm:pt-14">
        {list.length === 0 ? (
          <p className="rounded-2xl bg-bg-elevated px-6 py-5 text-text-tertiary">
            No practice problems yet.{' '}
            <Link href="/admin/practice/create" className="link">
              Create the first one
            </Link>
            .
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {list.map((p) => {
              const tags = (p.practice_problem_tags ?? []).map((t: any) => t.practice_tags).filter(Boolean);
              const d = DOMAIN_UI[domainFromTags(tags)];
              const c = countOf(p.id);
              const lvl = p.difficulty ? PRACTICE_DIFFICULTY_INFO[p.difficulty as keyof typeof PRACTICE_DIFFICULTY_INFO] : null;
              return (
                <li key={p.id} className="flex flex-col gap-4 rounded-[18px] bg-bg-surface p-5 sm:p-6 lg:flex-row lg:items-center lg:gap-8">
                  <span className={cn('hidden h-12 w-1.5 shrink-0 rounded-full lg:block', d.bg)} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                      <span className={cn('font-semibold', d.text)}>{d.label}</span>
                      <span className="text-text-muted">{metricShortName(p.scoring_metric)}</span>
                      {lvl && <span className={lvl.color}>{lvl.label}</span>}
                      {!hasKey(p.id) && <span className="text-amber">No answer key</span>}
                    </div>
                    <Link href={`/admin/practice/${p.id}/edit`} className="block truncate text-lg font-bold text-text-primary hover:underline">
                      {p.title}
                    </Link>
                    {tags.length > 0 && <p className="mt-1 truncate text-sm text-text-tertiary">{tags.map((t: any) => t.name).join(' · ')}</p>}
                  </div>
                  <dl className="grid grid-cols-2 gap-2 lg:w-[220px] lg:shrink-0">
                    <div className="rounded-xl bg-bg-elevated px-3 py-2.5">
                      <dt className="text-[13px] text-text-muted">Solvers</dt>
                      <dd className="font-mono text-lg">{c?.participant_count ?? 0}</dd>
                    </div>
                    <div className="rounded-xl bg-bg-elevated px-3 py-2.5">
                      <dt className="text-[13px] text-text-muted">Valid submissions</dt>
                      <dd className="font-mono text-lg">{c?.valid_submission_count ?? 0}</dd>
                    </div>
                  </dl>
                  <div className="flex flex-wrap items-center gap-2 lg:w-[220px] lg:shrink-0 lg:justify-end">
                    <Link href={`/admin/practice/${p.id}/edit`} className={buttonClasses({ variant: 'secondary', size: 'sm' })}>
                      Edit
                    </Link>
                    <Link href={`/practice/${p.id}`} className={buttonClasses({ variant: 'ghost', size: 'sm' })}>
                      View ↗
                    </Link>
                    <DeletePracticeProblemButton problemId={p.id} problemTitle={p.title} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
