import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PageBand } from '@/components/ui/PageBand';
import { Badge } from '@/components/ui/Badge';
import PracticeSubmitForm from './PracticeSubmitForm';
import { SCORING_METRIC_INFO, metricShortName } from '@/lib/constants';
import { metricDecimals } from '@/lib/leaderboard';
import { domainFromTags, DOMAIN_UI } from '@/lib/ui/phase';
import { vnDayStart, vnNextDayStart, vnDateTime, shortCountdown } from '@/lib/ui/dates';
import { validationSummary } from '@/lib/ui/validation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Props {
  params: { id: string };
}

const TONE = { nlp: 'violet', cv: 'amber', tabular: 'teal', other: 'blue' } as const;

export async function generateMetadata({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data } = (await supabase.from('practice_problems').select('title').eq('id', params.id).maybeSingle()) as { data: { title: string; description?: string | null } | null };
  return {
    title: data ? `Submit · ${data.title} – The Noders Platform` : 'The Noders Platform',
  };
}

export default async function PracticeSubmitPage({ params }: Props) {
  const { id } = params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/practice/${id}/submit`);

  const { data: problem } = (await supabase
    .from('practice_problems')
    .select('id, title, scoring_metric, daily_submission_limit, total_submission_limit, max_file_size_mb, sample_submission_url, practice_problem_tags(practice_tags(name, slug))')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()) as { data: any };
  if (!problem) notFound();

  const tags = (problem.practice_problem_tags ?? []).map((pt: any) => pt.practice_tags).filter(Boolean);
  const domain = domainFromTags(tags);
  const d = DOMAIN_UI[domain];
  const dec = metricDecimals(problem.scoring_metric);
  const metricInfo = SCORING_METRIC_INFO[problem.scoring_metric as keyof typeof SCORING_METRIC_INFO];

  const [{ count: today }, { count: total }, { data: mine }, { data: best }] = await Promise.all([
    supabase.from('practice_submissions').select('id', { count: 'exact', head: true }).eq('problem_id', id).eq('user_id', user.id).eq('validation_status', 'valid').gte('submitted_at', vnDayStart().toISOString()),
    supabase.from('practice_submissions').select('id', { count: 'exact', head: true }).eq('problem_id', id).eq('user_id', user.id).eq('validation_status', 'valid'),
    supabase.from('practice_submissions').select('id, file_name, score, validation_status, validation_errors, is_best_score, submitted_at').eq('problem_id', id).eq('user_id', user.id).order('submitted_at', { ascending: false }).limit(30),
    supabase.from('practice_submissions').select('score').eq('problem_id', id).eq('user_id', user.id).eq('is_best_score', true).eq('validation_status', 'valid').maybeSingle(),
  ]);

  const dailyLimit = problem.daily_submission_limit ?? 15;
  const leftToday = Math.max(0, dailyLimit - (today ?? 0));
  const totalLimit = problem.total_submission_limit ?? 0;
  const leftTotal = totalLimit > 0 ? Math.max(0, totalLimit - (total ?? 0)) : null;
  const reset = vnNextDayStart();
  const bestScore = (best as { score: number } | null)?.score ?? null;

  const blockedReason =
    leftTotal === 0
      ? 'You have used every submission this problem allows.'
      : leftToday === 0
        ? `No submissions left today. The limit resets in ${shortCountdown(reset) ?? 'a moment'} (midnight, Vietnam time).`
        : null;

  return (
    <>
      <PageBand crumbs={[{ label: 'Practice', href: '/practice' }, { label: problem.title, href: `/practice/${id}` }, { label: 'Submit' }]} title="Submit predictions">
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
          <div className="band-tile">
            <div className="text-sm text-navy-text">Left today</div>
            <div className="mt-1 font-mono text-2xl sm:text-[1.75rem]">
              {leftToday}
              <span className="text-[#7F93BA]"> / {dailyLimit}</span>
            </div>
          </div>
          <div className="band-tile">
            <div className="text-sm text-navy-text">In total</div>
            <div className="mt-1 text-xl font-semibold sm:text-2xl">{leftTotal === null ? 'No limit' : `${leftTotal} left`}</div>
          </div>
          <div className="band-tile">
            <div className="text-sm text-navy-text">Deadline</div>
            <div className="mt-1 text-xl font-semibold sm:text-2xl">None, ever</div>
          </div>
          <div className="rounded-xl bg-amber-strong px-5 py-4">
            <div className="text-sm text-amber-soft">Your best {metricShortName(problem.scoring_metric)}</div>
            <div className="mt-1 font-mono text-2xl sm:text-[1.75rem]">{bestScore !== null ? Number(bestScore).toFixed(dec) : '—'}</div>
          </div>
        </div>
      </PageBand>

      <section data-reveal className="shell pt-12 sm:pt-14">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1">
            <PracticeSubmitForm
              problemId={id}
              maxMb={problem.max_file_size_mb ?? 10}
              leftToday={leftToday}
              blockedReason={blockedReason}
              tone={TONE[domain]}
              metricName={metricInfo?.name ?? metricShortName(problem.scoring_metric)}
              decimals={dec}
            />
          </div>
          <aside className="flex w-full flex-col gap-4 lg:w-[340px] lg:shrink-0">
            <div className={`flex flex-col gap-2.5 rounded-[18px] p-6 ${d.bg}`}>
              <span className={`text-[13px] font-semibold ${d.text}`}>The file</span>
              <span className="text-[15px] text-text-secondary">
                Two columns, <span className="font-mono">id,prediction</span>, one row per test item. {metricInfo?.higher_is_better === false ? 'Lower' : 'Higher'} {metricShortName(problem.scoring_metric)} is better.
              </span>
              {problem.sample_submission_url && (
                <a href={problem.sample_submission_url} target="_blank" rel="noopener noreferrer" className={`text-sm font-semibold hover:underline ${d.text}`}>
                  Stuck? Open the starter notebook ↗
                </a>
              )}
            </div>
            <div className="rounded-[18px] bg-bg-elevated p-6 text-[15px] text-text-secondary">
              Only your best valid score appears on the leaderboard.{' '}
              <Link href={`/practice/${id}`} className="link">
                Back to the problem
              </Link>
            </div>
          </aside>
        </div>
      </section>

      <section data-reveal className="shell pb-24 pt-16 sm:pb-28 sm:pt-20">
        <h2 className="h-section mb-5">My submissions</h2>
        {(mine ?? []).length === 0 ? (
          <p className="rounded-2xl bg-bg-elevated px-6 py-5 text-text-tertiary">No submissions yet.</p>
        ) : (
          <ul className="overflow-hidden rounded-2xl bg-bg-surface">
            {(mine as any[]).map((s) => {
              const err = s.validation_status === 'invalid' ? validationSummary(s.validation_errors) : null;
              return (
                <li key={s.id} className="flex flex-col gap-1.5 border-t border-border-default px-4 py-3.5 first:border-t-0 sm:flex-row sm:items-center sm:gap-6 sm:px-6">
                  <span className="font-mono text-[13px] text-text-muted sm:w-40 sm:shrink-0">{vnDateTime(s.submitted_at)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-mono text-sm text-text-tertiary">{s.file_name}</span>
                    {err && <span className="block text-[13px] text-amber">{err}</span>}
                  </span>
                  <span className="flex items-center justify-between gap-4 sm:justify-end">
                    {s.validation_status === 'valid' ? (
                      <Badge variant="teal">{s.is_best_score ? 'Valid · best' : 'Valid'}</Badge>
                    ) : s.validation_status === 'invalid' ? (
                      <Badge variant="amber">Rejected</Badge>
                    ) : (
                      <Badge variant="blue">Scoring…</Badge>
                    )}
                    <span className="w-20 text-right font-mono">{s.score !== null ? Number(s.score).toFixed(dec) : '—'}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
