import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Crown } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { buttonClasses } from '@/components/ui/Button';
import { BandFacts } from '@/components/ui/PageBand';
import { Markdown } from '@/components/ui/Markdown';
import { Badge } from '@/components/ui/Badge';
import { SCORING_METRIC_INFO, metricShortName, metricArrow } from '@/lib/constants';
import { metricDecimals, higherIsBetter } from '@/lib/leaderboard';
import { getPracticeSummaries } from '@/lib/data/practice';
import { DOMAIN_UI, domainFromTags, prettyTag, type Domain } from '@/lib/ui/phase';
import { vnDayStart, vnDateTime } from '@/lib/ui/dates';
import { validationSummary } from '@/lib/ui/validation';
import { cn } from '@/lib/utils/cn';
import { plainText } from '@/lib/ui/text';
import SectionNav from '@/components/ui/SectionNav';

interface Props {
  params: { id: string };
}

const STRONG: Record<Domain, string> = { nlp: 'bg-violet-strong', cv: 'bg-amber-strong', tabular: 'bg-teal-strong', other: 'bg-navy-deep' };
const SOFT: Record<Domain, string> = { nlp: 'text-violet-soft', cv: 'text-amber-soft', tabular: 'text-teal-soft', other: 'text-navy-text' };
const TONE: Record<Domain, 'violet' | 'amber' | 'teal' | 'blue'> = { nlp: 'violet', cv: 'amber', tabular: 'teal', other: 'blue' };

export async function generateMetadata({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data } = (await supabase.from('practice_problems').select('title, description').eq('id', params.id).maybeSingle()) as { data: { title: string; description?: string | null } | null };
  return {
    title: data ? `${data.title} – The Noders Platform` : 'The Noders Platform',
    description: data?.description ? plainText(data.description).slice(0, 160) : undefined,
  };
}

export default async function PracticeProblemPage({ params }: Props) {
  const { id } = params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: problem } = (await supabase
    .from('practice_problems')
    .select(
      'id, title, description, problem_statement, scoring_metric, dataset_url, sample_submission_url, daily_submission_limit, total_submission_limit, max_file_size_mb, difficulty, practice_problem_tags(practice_tags(id, name, slug))'
    )
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()) as { data: any };

  if (!problem) notFound();

  const tags: { id: string; name: string; slug: string }[] = (problem.practice_problem_tags ?? []).map((pt: any) => pt.practice_tags).filter(Boolean);
  const domain = domainFromTags(tags);
  const d = DOMAIN_UI[domain];
  const hib = higherIsBetter(problem.scoring_metric);
  const dec = metricDecimals(problem.scoring_metric);
  const metricInfo = SCORING_METRIC_INFO[problem.scoring_metric as keyof typeof SCORING_METRIC_INFO];

  const [{ data: boardRaw }, { data: mineRaw }, { data: counts }, { count: todayCount }, others] = await Promise.all([
    supabase
      .from('practice_submissions')
      .select('user_id, score, submitted_at, users(full_name)')
      .eq('problem_id', id)
      .eq('is_best_score', true)
      .eq('validation_status', 'valid')
      .not('score', 'is', null)
      .order('score', { ascending: !hib })
      .order('submitted_at', { ascending: true })
      .limit(100),
    user
      ? supabase
          .from('practice_submissions')
          .select('id, score, is_best_score, validation_status, validation_errors, file_name, submitted_at')
          .eq('problem_id', id)
          .eq('user_id', user.id)
          .order('submitted_at', { ascending: false })
          .limit(50)
      : Promise.resolve({ data: [] as any[] }),
    supabase.from('practice_problem_submission_counts').select('participant_count, valid_submission_count').eq('problem_id', id).maybeSingle(),
    user
      ? supabase
          .from('practice_submissions')
          .select('id', { count: 'exact', head: true })
          .eq('problem_id', id)
          .eq('user_id', user.id)
          .eq('validation_status', 'valid')
          .gte('submitted_at', vnDayStart().toISOString())
      : Promise.resolve({ count: 0 }),
    getPracticeSummaries(supabase, user?.id),
  ]);

  const board = ((boardRaw ?? []) as any[]).map((r, i) => ({
    rank: i + 1,
    userId: r.user_id as string,
    name: (Array.isArray(r.users) ? r.users[0] : r.users)?.full_name ?? 'Participant',
    score: r.score as number,
  }));
  const mine = (mineRaw ?? []) as any[];
  const myEntry = user ? board.find((b) => b.userId === user.id) : undefined;
  const dailyLimit = problem.daily_submission_limit ?? 15;
  const leftToday = Math.max(0, dailyLimit - (todayCount ?? 0));
  const c = counts as { participant_count: number; valid_submission_count: number } | null;
  const next = others.filter((p) => p.id !== id).slice(0, 3);
  const topicChips = tags.map((t) => prettyTag(t.name)).filter((t, i, a) => a.indexOf(t) === i);

  return (
    <>
      {/* ── Problem bar, tinted by domain ── */}
      <div data-sticky-bar className={cn('sticky top-[65px] z-30 border-b border-white/[0.06] lg:top-[69px]', d.bg)}>
        <div className="shell flex min-h-[52px] items-center gap-4 sm:gap-7">
          <span className="hidden max-w-[260px] shrink-0 truncate text-[15px] font-bold md:inline">{problem.title}</span>
          <SectionNav
            items={[
              { id: 'overview', label: 'Overview' },
              { id: 'board', label: 'Leaderboard' },
              ...(user ? [{ id: 'mine', label: 'My submissions' }] : []),
            ]}
          />
          {user && (
            <span className={cn('hidden shrink-0 text-[13px] sm:inline', d.muted)}>
              <span className="font-mono text-white">{leftToday}</span> of {dailyLimit} left today
            </span>
          )}
          <Link
            href={user ? `/practice/${id}/submit` : `/login?redirect=/practice/${id}`}
            className={buttonClasses({ variant: 'accent', tone: TONE[domain], size: 'sm', className: 'shrink-0' })}
          >
            {user ? 'Submit CSV' : 'Sign in'}
          </Link>
        </div>
      </div>

      {/* ── Navy hero ── */}
      <section className="band">
        <div className="shell pb-10 pt-9 sm:pb-12 sm:pt-11">
          <nav aria-label="Breadcrumb" className="mb-6 text-sm text-navy-text sm:mb-7">
            <Link href="/practice" className="band-link">
              Practice
            </Link>{' '}
            <span className="opacity-60">/</span> {d.label}
          </nav>
          <div className="flex flex-col gap-9 lg:flex-row lg:items-center lg:gap-16">
            <div className="min-w-0 flex-1">
              <div className="mb-4 flex flex-wrap gap-2">
                <span className={cn('rounded-md bg-white/10 px-2.5 py-0.5 text-[13px] font-semibold', SOFT[domain])}>{d.label}</span>
                {topicChips.map((t) => (
                  <span key={t} className="rounded-md bg-white/10 px-2.5 py-0.5 text-[13px] font-semibold text-navy-text">
                    {t}
                  </span>
                ))}
                {problem.difficulty && <span className="rounded-md bg-teal/15 px-2.5 py-0.5 text-[13px] font-semibold capitalize text-teal-soft">{problem.difficulty}</span>}
              </div>
              <h1 className="text-balance text-[2.125rem] font-bold leading-[1.08] tracking-[-0.03em] sm:text-[2.625rem] lg:text-[3rem]">{problem.title}</h1>
              {problem.description && <p className="mt-4 line-clamp-4 max-w-[600px] text-base text-navy-text sm:text-lg">{plainText(problem.description)}</p>}
            </div>
            <div className="w-full min-w-0 lg:w-[400px] lg:shrink-0">
              <div className={cn('flex flex-col gap-3 rounded-2xl p-6 shadow-lift', STRONG[domain])}>
                <span className={cn('text-sm', SOFT[domain])}>Your best</span>
                {myEntry ? (
                  <>
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="font-mono text-[2rem] leading-none">{myEntry.score.toFixed(dec)}</span>
                      <span className="font-mono text-xl text-white/80">#{myEntry.rank}</span>
                    </span>
                    <span className="text-sm text-white/75">of {board.length} on the board · {metricShortName(problem.scoring_metric)}</span>
                  </>
                ) : (
                  <>
                    <span className="text-[1.375rem] font-bold leading-tight">Not on the board yet.</span>
                    <span className="text-sm text-white/75">
                      {board.length === 0 ? 'No scores yet.' : `${board.length} ${board.length === 1 ? 'person has' : 'people have'} scored so far.`}
                    </span>
                  </>
                )}
                <Link
                  href={user ? `/practice/${id}/submit` : `/login?redirect=/practice/${id}`}
                  className={buttonClasses({ variant: 'accent', tone: TONE[domain], className: 'mt-1 w-fit' })}
                >
                  {user ? 'Submit predictions' : 'Sign in to submit'}
                </Link>
              </div>
            </div>
          </div>
          <BandFacts
            className="mt-10"
            facts={[
              { value: c?.participant_count ?? board.length, label: 'people on the board' },
              { value: c?.valid_submission_count ?? 0, label: 'valid submissions', color: 'text-blue-soft' },
              { value: board[0] ? board[0].score.toFixed(dec) : '—', label: `top ${metricShortName(problem.scoring_metric)}`, color: 'text-gold' },
              { value: dailyLimit, label: 'submissions a day', color: 'text-teal-soft' },
            ]}
          />
        </div>
      </section>

      {/* ── Overview ── */}
      <section data-reveal id="overview" className="shell scroll-mt-32 pt-16 sm:pt-20">
        <h2 className="h-section mb-6">The problem</h2>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <article className="min-w-0 flex-1 rounded-[18px] bg-bg-surface p-6 sm:p-8">
            {problem.problem_statement ? <Markdown accent={d.text}>{problem.problem_statement}</Markdown> : <p className="text-text-tertiary">{problem.description || 'No problem statement yet.'}</p>}
          </article>
          <aside className="flex w-full flex-col gap-4 lg:sticky lg:top-[140px] lg:w-[360px] lg:shrink-0">
            <div className={cn('flex flex-col gap-4 rounded-[18px] p-6', d.bg)}>
              <div>
                <div className={cn('mb-1 text-[13px] font-semibold', d.text)}>Metric</div>
                <div className="font-semibold">{metricInfo?.name ?? problem.scoring_metric}</div>
                <div className={cn('text-sm', d.muted)}>{hib ? 'Higher is better ↑' : 'Lower is better ↓'}</div>
              </div>
              <div>
                <div className={cn('mb-1 text-[13px]', d.muted)}>File</div>
                <div>
                  CSV with <span className="font-mono">id,prediction</span>, up to {problem.max_file_size_mb ?? 10} MB
                </div>
              </div>
              <div>
                <div className={cn('mb-1 text-[13px]', d.muted)}>Limits</div>
                <div>
                  {dailyLimit} a day · {problem.total_submission_limit ? `${problem.total_submission_limit} in total` : 'no total limit'}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {problem.dataset_url && (
                <a href={problem.dataset_url} target="_blank" rel="noopener noreferrer" className="lift flex flex-col gap-1 rounded-2xl bg-blue-bg p-4 text-text-primary">
                  <span className="text-[13px] font-semibold text-blue">Dataset ↗</span>
                  <span className="font-bold">Download data</span>
                </a>
              )}
              {problem.sample_submission_url && (
                <a href={problem.sample_submission_url} target="_blank" rel="noopener noreferrer" className="lift flex flex-col gap-1 rounded-2xl bg-teal-bg p-4 text-text-primary">
                  <span className="text-[13px] font-semibold text-teal">{/colab/.test(problem.sample_submission_url) ? 'Colab ↗' : 'Sample ↗'}</span>
                  <span className="font-bold">{/colab/.test(problem.sample_submission_url) ? 'Starter notebook' : 'Sample file'}</span>
                </a>
              )}
            </div>
          </aside>
        </div>
      </section>

      {/* ── Leaderboard + my submissions ── */}
      <section data-reveal className="shell pt-16 sm:pt-20">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-6">
          <div id="board" className="min-w-0 flex-1 scroll-mt-32">
            <h2 className="h-section mb-5">Leaderboard</h2>
            <div className="overflow-hidden rounded-2xl bg-bg-surface">
              <ol>
                {board.map((b) => {
                  const me = user && b.userId === user.id;
                  return (
                    <li key={b.userId} className={cn('flex items-center gap-4 border-t border-border-default px-4 py-3 first:border-t-0 sm:px-5', me && 'bg-blue/[0.08]')}>
                      <span
                        className={cn(
                          'inline-flex h-[26px] min-w-[30px] items-center justify-center rounded-md font-mono text-[13px]',
                          b.rank === 1 ? 'bg-amber-strong text-gold' : b.rank === 2 ? 'bg-[#252B36] text-silver' : b.rank === 3 ? 'bg-[#2E2018] text-bronze' : 'text-text-muted'
                        )}
                      >
                        {String(b.rank).padStart(2, '0')}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-semibold">
                        {b.name}
                        {me && <span className="ml-2 text-[13px] font-normal text-blue">you</span>}
                      </span>
                      <span className="font-mono">{b.score.toFixed(dec)}</span>
                    </li>
                  );
                })}
                {!myEntry && (
                  <li className={cn('flex items-center gap-4 border-dashed border-border-subtle px-4 py-3 sm:px-5', board.length > 0 && 'border-t')}>
                    <span className="inline-flex h-[26px] min-w-[30px] items-center justify-center rounded-md border border-dashed border-border-subtle font-mono text-[13px] text-text-muted">
                      {String(board.length + 1).padStart(2, '0')}
                    </span>
                    <span className="min-w-0 flex-1 text-text-muted">{user ? 'Your spot, once you submit' : 'Sign in and submit to join the board'}</span>
                    <Link href={user ? `/practice/${id}/submit` : `/login?redirect=/practice/${id}`} className={cn('shrink-0 text-sm font-semibold hover:underline', d.text)}>
                      {user ? 'Submit →' : 'Sign in →'}
                    </Link>
                  </li>
                )}
              </ol>
            </div>
            <p className="mt-2.5 text-[13px] text-text-muted">Best valid score per person. Ties go to whoever submitted first.</p>
          </div>

          {user && (
            <div id="mine" className="w-full scroll-mt-32 lg:w-[420px] lg:shrink-0">
              <h2 className="h-section mb-5">My submissions</h2>
              {mine.length === 0 ? (
                <p className="rounded-2xl bg-bg-elevated px-5 py-4 text-text-tertiary">
                  Nothing yet. Each upload shows here with its score, or the exact reason it was rejected. Rejected files don&apos;t use up your daily limit.
                </p>
              ) : (
                <ul className="overflow-hidden rounded-2xl bg-bg-surface">
                  {mine.map((s) => {
                    const err = s.validation_status === 'invalid' ? validationSummary(s.validation_errors) : null;
                    return (
                      <li key={s.id} className="flex flex-col gap-1 border-t border-border-default px-4 py-3 first:border-t-0 sm:px-5">
                        <span className="flex items-center justify-between gap-3">
                          <span className="min-w-0 truncate font-mono text-[13px] text-text-tertiary">{s.file_name}</span>
                          <span className="shrink-0 font-mono">{s.score !== null ? Number(s.score).toFixed(dec) : '—'}</span>
                        </span>
                        <span className="flex flex-wrap items-center justify-between gap-2 text-[13px]">
                          <span className="font-mono text-text-muted">{vnDateTime(s.submitted_at)}</span>
                          {s.validation_status === 'valid' ? (
                            <Badge variant="teal">{s.is_best_score ? 'Valid · best' : 'Valid'}</Badge>
                          ) : s.validation_status === 'invalid' ? (
                            <Badge variant="amber">Rejected</Badge>
                          ) : (
                            <Badge variant="blue">Scoring…</Badge>
                          )}
                        </span>
                        {err && <span className="text-[13px] text-amber">{err}</span>}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── Try next ── */}
      {next.length > 0 && (
        <section data-reveal className="shell pb-24 pt-16 sm:pb-28 sm:pt-20">
          <h2 className="h-section mb-5">Try next</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {next.map((p) => {
              const u = DOMAIN_UI[p.domain];
              return (
                <Link key={p.id} href={`/practice/${p.id}`} className={cn('lift flex flex-col gap-2 rounded-2xl p-6 text-text-primary', u.bg)}>
                  <span className={cn('text-[13px] font-semibold', u.text)}>
                    {u.label} · {metricShortName(p.scoring_metric)} {metricArrow(p.scoring_metric)}
                  </span>
                  <span className="text-lg font-bold leading-snug">{p.title}</span>
                  <span className={cn('mt-auto flex items-center gap-1.5 text-[13px]', u.muted)}>
                    {p.topScore !== null && (
                      <>
                        <Crown className="h-3.5 w-3.5 text-gold" aria-hidden /> top <span className="font-mono text-text-primary">{p.topScore.toFixed(metricDecimals(p.scoring_metric))}</span> ·
                      </>
                    )}{' '}
                    {p.solvers} on the board
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}
      {next.length === 0 && <div className="pb-24" />}
    </>
  );
}
