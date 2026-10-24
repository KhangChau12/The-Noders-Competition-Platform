import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { buttonClasses } from '@/components/ui/Button';
import { BandFacts } from '@/components/ui/PageBand';
import { Countdown } from '@/components/ui/Countdown';
import { Markdown } from '@/components/ui/Markdown';
import { Badge } from '@/components/ui/Badge';
import ContestLeaderboard, { type LbRow } from './ContestLeaderboard';
import { SCORING_METRIC_INFO, metricShortName, metricArrow } from '@/lib/constants';
import { getCompetitionPhase, getNextDeadline, type CompetitionPhase } from '@/lib/utils/competition';
import { rankContest, metricDecimals } from '@/lib/leaderboard';
import { splitTitle, getCompetitionById, getBoard } from '@/lib/data/competitions';
import { PHASE_UI } from '@/lib/ui/phase';
import { vnRange, vnDate, vnDay, vnTime, vnDateTime, shortCountdown, vnDayStart } from '@/lib/ui/dates';
import { validationSummary } from '@/lib/ui/validation';
import { cn } from '@/lib/utils/cn';
import { plainText } from '@/lib/ui/text';
import SectionNav from '@/components/ui/SectionNav';
import InfoTip from '@/components/ui/InfoTip';

interface PageProps {
  params: { id: string };
}

type Registration = { id: string; status: 'pending' | 'approved' | 'rejected'; team_id: string | null; team_name?: string | null };

export async function generateMetadata({ params }: { params: { id: string } }) {
  const data = await getCompetitionById(params.id);
  return {
    title: data ? `${data.title} – The Noders Platform` : 'The Noders Platform',
    description: data?.description ? plainText(data.description).slice(0, 160) : undefined,
  };
}

/** The viewer's registration (any status; approved wins), quota and own submissions. Runs alongside the public board fetch. */
async function loadViewer(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, competition: any, now: Date) {
  const id = competition.id as string;
  const isTeam = competition.participation_type === 'team';

  let registration: Registration | null = null;
  if (isTeam) {
    const { data: memberships } = await supabase.from('team_members').select('team_id').eq('user_id', userId);
    const teamIds = ((memberships ?? []) as { team_id: string }[]).map((m) => m.team_id);
    if (teamIds.length) {
      const { data: regs } = (await supabase.from('registrations').select('id, status, team_id, teams(name)').eq('competition_id', id).in('team_id', teamIds)) as { data: any[] | null };
      const pick = (regs ?? []).sort((a, b) => rankStatus(a.status) - rankStatus(b.status))[0];
      if (pick) registration = { id: pick.id, status: pick.status, team_id: pick.team_id, team_name: (Array.isArray(pick.teams) ? pick.teams[0] : pick.teams)?.name ?? null };
    }
  } else {
    const { data: reg } = (await supabase.from('registrations').select('id, status, team_id').eq('competition_id', id).eq('user_id', userId).maybeSingle()) as { data: Registration | null };
    registration = reg;
  }
  if (!registration) return { registration, quota: { daily: 0, total: 0 }, mySubs: null as any[] | null };

  // Quota counts valid + pending (daily resets at midnight Vietnam time); fetched with the viewer's submissions.
  const [col, val] = isTeam ? ['team_id', registration.team_id as string] : ['user_id', userId];
  const counted = ['valid', 'pending'];
  const [{ count: total }, { count: daily }, { data: mySubs }] = await Promise.all([
    supabase.from('submissions').select('id', { count: 'exact', head: true }).eq('competition_id', id).eq(col, val).in('validation_status', counted),
    supabase.from('submissions').select('id', { count: 'exact', head: true }).eq('competition_id', id).eq(col, val).in('validation_status', counted).gte('submitted_at', vnDayStart(now).toISOString()),
    supabase
      .from('submissions')
      .select('id, file_name, phase, score, validation_status, validation_errors, is_best_score, submitted_at, submitter:users!submissions_submitted_by_fkey(full_name)')
      .eq('competition_id', id)
      .eq(col, val)
      .order('submitted_at', { ascending: false })
      .limit(50),
  ]);
  return { registration, quota: { daily: daily ?? 0, total: total ?? 0 }, mySubs: (mySubs as any[] | null) ?? null };
}

export default async function CompetitionDetailPage({ params }: PageProps) {
  const { id } = params;
  const supabase = await createClient();

  // Contest (cached, shared with generateMetadata) and the session load together.
  const [competition, { data: { user } }] = await Promise.all([getCompetitionById(id), supabase.auth.getUser()]);
  if (!competition) notFound();

  const now = new Date();
  const phase = getCompetitionPhase(competition as any, now);
  const deadline = getNextDeadline(competition as any, phase);
  const isTeam = competition.participation_type === 'team';
  const fourPhase = competition.competition_type === '4-phase';
  const privateStarted = !!competition.private_test_start && now >= new Date(competition.private_test_start);
  const ended = phase === 'ended';
  const metricInfo = SCORING_METRIC_INFO[competition.scoring_metric as keyof typeof SCORING_METRIC_INFO];
  const dec = metricDecimals(competition.scoring_metric);
  const { code, name } = splitTitle(competition.title);

  // Public board (cached) and the viewer's own data in parallel.
  const [board, viewer] = await Promise.all([getBoard(id, ended), user ? loadViewer(supabase, user.id, competition, now) : Promise.resolve(null)]);
  const registration = viewer?.registration ?? null;
  const quota = viewer?.quota ?? { daily: 0, total: 0 };
  const mySubs = { data: viewer?.mySubs ?? null };
  const approved = registration?.status === 'approved';
  const dailyLimit = competition.daily_submission_limit ?? 5;
  const totalLimit = competition.total_submission_limit ?? 50;
  const running = phase === 'public_test' || phase === 'private_test';
  const canSubmit = approved && running && quota.daily < dailyLimit && quota.total < totalLimit;
  const allSubs = board.submissions;

  const one = (v: any) => (Array.isArray(v) ? v[0] ?? null : v);
  const rows: LbRow[] = board.rows.map((r: any) => ({
    score: r.score,
    submitted_at: r.submitted_at,
    phase: r.phase,
    user_id: r.user_id,
    team_id: r.team_id,
    submitted_by: r.submitted_by,
    user_name: one(r.users)?.full_name ?? null,
    team_name: one(r.teams)?.name ?? null,
    submitter_name: one(r.submitter)?.full_name ?? null,
  }));
  const participants = board.participants;
  const teamsSubmitted = isTeam ? new Set(rows.map((r) => r.team_id).filter(Boolean)).size : null;

  const standings = ended ? rankContest(rows, (r) => (isTeam ? r.team_id : r.user_id), competition.scoring_metric, fourPhase) : [];
  const topPerson = ended && isTeam ? rankContest(rows, (r) => r.submitted_by, competition.scoring_metric, fourPhase)[0] : null;

  const ui = PHASE_UI[phase];
  const subBarBg = running ? (phase === 'private_test' ? 'bg-amber-bg' : 'bg-blue-bg') : phase === 'registration' ? 'bg-violet-bg' : 'bg-bg-elevated';
  const subAccent = running ? (phase === 'private_test' ? 'text-amber' : 'text-blue') : phase === 'registration' ? 'text-violet' : 'text-text-tertiary';
  const verb: Record<CompetitionPhase, string> = { upcoming: 'opens in', registration: 'closes in', public_test: 'ends in', private_test: 'ends in', ended: '' };
  const endAt = competition.private_test_end ?? competition.public_test_end;

  return (
    <>
      {/* ── Contest bar: sticks under the site header ── */}
      <div data-sticky-bar className={cn('sticky top-[65px] z-30 border-b border-white/[0.06] lg:top-[69px]', subBarBg)}>
        <div className="shell flex min-h-[52px] items-center gap-4 sm:gap-7">
          <span className="hidden shrink-0 text-[15px] font-bold sm:inline">{code ?? name}</span>
          <span className={cn('hidden shrink-0 items-center gap-2 rounded-md bg-white/[0.06] px-2.5 py-1 text-[13px] font-semibold md:inline-flex', subAccent)}>
            <span className={cn('h-1.5 w-1.5 rounded-full', ui.fill)} aria-hidden />
            {ended ? `Ended ${vnDate(endAt)}` : `${ui.label}${deadline ? ` · ${verb[phase]} ${shortCountdown(deadline, now) ?? ''}` : ''}`}
          </span>
          <SectionNav
            items={[
              { id: 'leaderboard', label: 'Leaderboard' },
              { id: 'problem', label: 'Problem' },
              { id: 'settings', label: 'Rules & data' },
              ...(registration ? [{ id: 'mine', label: isTeam ? 'Team submissions' : 'My submissions' }] : []),
            ]}
          />
          {canSubmit && (
            <Link href={`/competitions/${id}/submit`} className={buttonClasses({ variant: 'accent', tone: phase === 'private_test' ? 'amber' : 'blue', size: 'sm', className: 'shrink-0' })}>
              Submit CSV
            </Link>
          )}
        </div>
      </div>

      {/* ── Navy hero ── */}
      <section className="band">
        <div className="shell pb-10 pt-9 sm:pb-12 sm:pt-11">
          <nav aria-label="Breadcrumb" className="mb-6 text-sm text-navy-text sm:mb-7">
            <Link href="/competitions" className="band-link">
              Competitions
            </Link>{' '}
            <span className="opacity-60">/</span> {code ?? name}
          </nav>
          <div className="flex flex-col gap-9 lg:flex-row lg:items-stretch lg:gap-16">
            <div className="flex min-w-0 flex-1 flex-col">
              <p className="eyebrow mb-3.5">
                {isTeam ? `Team contest · teams of ${competition.min_team_size ?? 1}–${competition.max_team_size ?? 3}` : 'Individual contest'} ·{' '}
                {fourPhase ? '4 phases' : '3 phases'} · {ended ? `ended ${vnDate(endAt)}` : ui.label.toLowerCase()}
              </p>
              <h1 className="text-balance text-[2.125rem] font-bold leading-[1.08] tracking-[-0.03em] sm:text-[2.625rem] lg:text-[3rem]">{competition.title}</h1>
              <p className="mt-5 line-clamp-4 max-w-[600px] text-base text-navy-text sm:text-lg">{plainText(competition.description)}</p>
              <div className="mt-7 flex flex-wrap gap-3 lg:mt-auto lg:pt-7">
                <a href="#problem" className={buttonClasses({ size: 'lg', className: 'bg-white text-navy-deep' })}>
                  Read the problem
                </a>
                {approved && competition.dataset_url && (
                  <a
                    href={competition.dataset_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonClasses({ variant: 'outline', size: 'lg', className: 'border-white/50 text-white hover:border-white hover:bg-white/5' })}
                  >
                    Dataset ↗
                  </a>
                )}
              </div>
            </div>
            <div className="w-full min-w-0 lg:w-[420px] lg:shrink-0">
              <HeroCard
                phase={phase}
                id={id}
                user={!!user}
                registration={registration}
                isTeam={isTeam}
                deadline={deadline}
                quota={quota}
                dailyLimit={dailyLimit}
                canSubmit={canSubmit}
                standings={standings.slice(0, 3).map((s) => ({
                  name: isTeam ? s.sample.team_name ?? 'Team' : s.sample.user_name ?? 'Participant',
                  score: s.score,
                  pub: s.publicScore,
                  priv: s.privateScore,
                }))}
                topPerson={topPerson ? { name: topPerson.sample.submitter_name ?? 'Member', team: topPerson.sample.team_name, score: topPerson.score } : null}
                fourPhase={fourPhase}
                dec={dec}
              />
            </div>
          </div>
          <BandFacts
            className="mt-10"
            facts={[
              { value: participants, label: 'participants' },
              ...(teamsSubmitted !== null ? [{ value: teamsSubmitted, label: 'teams submitted', color: 'text-violet-soft' }] : []),
              { value: (allSubs ?? 0).toLocaleString('en-US'), label: 'submissions', color: 'text-blue-soft' },
              { value: vnRange(competition.registration_start, endAt), label: 'contest window', color: 'text-teal-soft' },
            ]}
          />
        </div>
      </section>

      {/* ── Timeline ── */}
      <section data-reveal aria-label="Timeline" className="shell pt-12 sm:pt-14">
        <ol className="flex flex-col gap-2.5 md:flex-row">
          {[
            { name: 'Registration', from: competition.registration_start, to: competition.registration_end, text: 'text-violet', fill: 'bg-violet', bg: 'bg-violet-bg', grow: 1 },
            { name: 'Public test', from: competition.public_test_start, to: competition.public_test_end, text: 'text-blue', fill: 'bg-blue', bg: 'bg-blue-bg', grow: 3 },
            ...(fourPhase && competition.private_test_start && competition.private_test_end
              ? [{ name: 'Private test', from: competition.private_test_start, to: competition.private_test_end, text: 'text-amber', fill: 'bg-amber', bg: 'bg-amber-bg', grow: 1 }]
              : []),
          ].map((p) => {
            const a = new Date(p.from).getTime();
            const b = new Date(p.to).getTime();
            const t = now.getTime();
            const state = t >= b ? 'Done' : t >= a ? 'Now' : 'Next';
            const pct = state === 'Done' ? 100 : state === 'Now' ? Math.round(((t - a) / (b - a)) * 100) : 0;
            return (
              <li key={p.name} className={cn('flex min-w-0 flex-col gap-1 rounded-2xl px-5 py-4', state === 'Next' ? 'bg-bg-elevated' : p.bg, state === 'Now' && 'ring-1 ring-inset ring-white/15')} style={{ flexGrow: p.grow, flexBasis: 0 }}>
                <span className={cn('flex justify-between gap-3 text-[13px] font-semibold', p.text)}>
                  <span>{p.name}</span>
                  <span>{state}</span>
                </span>
                <span className="text-[15px] font-semibold">
                  {vnDay(p.from)} {vnTime(p.from)} – {vnDay(p.to)} {vnTime(p.to)}
                </span>
                <span className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.08]">
                  <span className={cn('block h-1 origin-left animate-grow-x', p.fill)} style={{ width: `${pct}%` }} />
                </span>
              </li>
            );
          })}
        </ol>
      </section>

      {/* ── Leaderboard ── */}
      <section data-reveal id="leaderboard" aria-labelledby="lh" className="shell scroll-mt-32 pt-16 sm:pt-20">
        <h2 id="lh" className="h-section flex items-center gap-2.5">
          {ended && fourPhase ? 'Final leaderboard' : 'Leaderboard'}
          {running && (
            <InfoTip label="How often the leaderboard updates">
              <span className="mb-1 block font-semibold text-text-primary">Did you know?</span>
              The leaderboard refreshes about once a minute, so a new score can take up to a minute to appear here. Don’t worry if your name isn’t on it yet — your result is already saved under My submissions.
            </InfoTip>
          )}
        </h2>
        <p className="mb-6 mt-1.5 text-text-tertiary">
          {ended ? (fourPhase ? 'Ranked by the average of public and private scores.' : 'Ranked by best public score.') : running ? 'Provisional until the contest ends.' : 'Scores appear here once the public test opens.'}
        </p>
        <ContestLeaderboard
          rows={rows}
          metric={competition.scoring_metric}
          isTeam={isTeam}
          fourPhase={fourPhase}
          privateStarted={privateStarted}
          ended={ended}
          userId={user?.id}
          userTeamId={approved && isTeam ? registration!.team_id : null}
        />
      </section>

      {/* ── Problem ── */}
      <section data-reveal id="problem" className="shell scroll-mt-32 pt-20 sm:pt-24">
        <h2 className="h-section mb-6">The problem</h2>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <article className="min-w-0 flex-1 rounded-[18px] bg-bg-surface p-6 sm:p-8">
            {competition.problem_statement ? <Markdown>{competition.problem_statement}</Markdown> : <p className="text-text-tertiary">The problem statement has not been published yet.</p>}
          </article>
          <aside className="flex w-full flex-col gap-4 rounded-[18px] bg-amber-bg p-6 lg:sticky lg:top-[140px] lg:w-[340px] lg:shrink-0">
            <div>
              <div className="mb-1 text-[13px] font-semibold text-amber">Metric</div>
              <div className="font-semibold">{metricInfo?.name ?? competition.scoring_metric}</div>
              <div className="text-sm text-amber-soft">{metricInfo?.higher_is_better === false ? 'Lower is better ↓' : 'Higher is better ↑'}</div>
              {metricInfo?.description && <p className="mt-1.5 text-sm text-amber-muted">{metricInfo.description}</p>}
            </div>
            <div>
              <div className="mb-1 text-[13px] text-amber-muted">Submission</div>
              <div>
                CSV with <span className="font-mono text-amber-soft">id,prediction</span>, up to {competition.max_file_size_mb ?? 10} MB
              </div>
            </div>
            <Link href="/guide#scoring" className="text-sm font-semibold text-amber hover:underline">
              How scoring works →
            </Link>
          </aside>
        </div>
      </section>

      {/* ── Settings & data ── */}
      <section data-reveal id="settings" className="shell scroll-mt-32 pt-20 sm:pt-24">
        <h2 className="h-section mb-6">Rules &amp; data</h2>
        <div data-reveal-group className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <RuleCard
            tone="violet"
            eyebrow="Entry"
            headline={isTeam ? `Teams of ${competition.min_team_size ?? 1}–${competition.max_team_size ?? 3}` : 'Individual'}
            sub={`${fourPhase ? '4' : '3'}-phase contest`}
            rows={[
              ['Who registers', isTeam ? 'The team leader' : 'Each participant'],
              ['Approval', 'Reviewed by organisers'],
              ['Registration', vnRange(competition.registration_start, competition.registration_end)],
              ...(isTeam ? ([['One team per person', 'Per contest']] as [string, string][]) : []),
            ]}
          />
          <RuleCard
            tone="blue"
            eyebrow="Submissions"
            headline={`${dailyLimit} a day`}
            sub="Resets at 00:00, Vietnam time"
            rows={[
              ['Total limit', totalLimit >= 1000 ? 'No practical limit' : `${totalLimit.toLocaleString('en-US')} submissions`],
              ['File', `CSV, up to ${competition.max_file_size_mb ?? 10} MB`],
              ['Columns', <span key="c" className="font-mono text-[13px]">id, prediction</span>],
              ['Rejected files', 'Do not count'],
              ...(isTeam ? ([['Limits', 'Shared by the team']] as [string, string][]) : []),
            ]}
          />
          <RuleCard
            tone="amber"
            eyebrow="Scoring"
            headline={`${metricShortName(competition.scoring_metric)} ${metricArrow(competition.scoring_metric)}`}
            sub={metricInfo?.higher_is_better === false ? 'Lower is better' : 'Higher is better'}
            rows={[
              ['Counted', 'Best valid score'],
              ['Ties', 'Earliest submission wins'],
              ['Final ranking', fourPhase ? 'Average of public and private' : 'Public test score'],
              ['Decimals', `${dec}`],
            ]}
            className="md:col-span-2 lg:col-span-1"
          />
        </div>

        <div data-reveal-group className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {competition.dataset_url && (approved || ended) ? (
            <ResourceLink href={competition.dataset_url} external tone="teal" label="Dataset" title="Download the dataset" note="Opens in a new tab" />
          ) : (
            <div className="flex flex-col gap-1 rounded-[18px] border border-dashed border-border-subtle p-5 sm:p-6">
              <span className="text-[13px] font-semibold text-text-tertiary">Dataset</span>
              <span className="font-bold text-text-secondary">{competition.dataset_url ? 'Available after approval' : 'Not published yet'}</span>
              <span className="text-sm text-text-muted">{competition.dataset_url ? 'The link appears once your registration is approved.' : 'Organisers will add the link before the public test.'}</span>
            </div>
          )}
          {competition.sample_submission_url ? (
            <ResourceLink href={competition.sample_submission_url} external tone="blue" label="Sample" title="Sample submission" note="Example of the expected CSV" />
          ) : (
            <ResourceLink href="/guide#csv" tone="blue" label="Format" title="How to format the CSV" note="Platform guide" />
          )}
          <ResourceLink href="/verify" tone="neutral" label="Certificates" title="Verify a certificate" note="Check a code issued for this contest" />
        </div>
      </section>

      {/* ── The viewer's (team's) submissions ── */}
      {registration && (
        <section data-reveal id="mine" className="shell scroll-mt-32 pt-20 sm:pt-24">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <h2 className="h-section">{isTeam ? 'Team submissions' : 'My submissions'}</h2>
            {canSubmit && (
              <Link href={`/competitions/${id}/submit`} className={buttonClasses({ variant: 'accent', tone: 'blue' })}>
                Submit CSV
              </Link>
            )}
          </div>
          <MySubmissions rows={(mySubs.data as any[] | null) ?? []} isTeam={isTeam} fourPhase={fourPhase} dec={dec} />
        </section>
      )}
      <div className="pb-24 sm:pb-28" />
    </>
  );
}

function rankStatus(s: string) {
  return s === 'approved' ? 0 : s === 'pending' ? 1 : 2;
}

const RULE_TONE = {
  violet: { bg: 'bg-violet-bg', text: 'text-violet', soft: 'text-violet-muted' },
  blue: { bg: 'bg-blue-bg', text: 'text-blue', soft: 'text-blue-muted' },
  amber: { bg: 'bg-amber-bg', text: 'text-amber', soft: 'text-amber-muted' },
  teal: { bg: 'bg-teal-bg', text: 'text-teal', soft: 'text-teal-muted' },
  neutral: { bg: 'bg-bg-elevated', text: 'text-text-tertiary', soft: 'text-text-muted' },
} as const;

/** One rules card: coloured header with the key fact, then label/value rows. */
function RuleCard({ tone, eyebrow, headline, sub, rows, className }: { tone: 'violet' | 'blue' | 'amber'; eyebrow: string; headline: string; sub: string; rows: [string, React.ReactNode][]; className?: string }) {
  const t = RULE_TONE[tone];
  return (
    <div className={cn('flex flex-col overflow-hidden rounded-[18px] bg-bg-surface', className)}>
      <div className={cn('px-5 pb-5 pt-5 sm:px-6', t.bg)}>
        <div className={cn('text-[13px] font-semibold', t.text)}>{eyebrow}</div>
        <div className="mt-1.5 text-xl font-bold leading-tight tracking-[-0.01em] sm:text-[1.375rem]">{headline}</div>
        <div className={cn('mt-1 text-sm', t.soft)}>{sub}</div>
      </div>
      <dl className="flex flex-1 flex-col px-5 py-2 sm:px-6">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-4 border-t border-border-default py-3 first:border-t-0">
            <dt className="text-sm text-text-tertiary">{k}</dt>
            <dd className="text-right text-[15px] font-semibold text-text-primary">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** Link card under the rules (dataset, sample, certificates). */
function ResourceLink({ href, external, tone, label, title, note }: { href: string; external?: boolean; tone: keyof typeof RULE_TONE; label: string; title: string; note: string }) {
  const t = RULE_TONE[tone];
  const cls = cn('lift group flex items-center justify-between gap-4 rounded-[18px] p-5 text-text-primary sm:p-6', t.bg);
  const body = (
    <>
      <span className="flex min-w-0 flex-col gap-1">
        <span className={cn('text-[13px] font-semibold', t.text)}>{label}</span>
        <span className="font-bold">{title}</span>
        <span className={cn('text-sm', t.soft)}>{note}</span>
      </span>
      <span aria-hidden className={cn('shrink-0 text-xl transition-transform group-hover:translate-x-0.5', t.text)}>
        {external ? '↗' : '→'}
      </span>
    </>
  );
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
      {body}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {body}
    </Link>
  );
}

function HeroCard(props: {
  phase: CompetitionPhase;
  id: string;
  user: boolean;
  registration: Registration | null;
  isTeam: boolean;
  deadline: Date | null;
  quota: { daily: number; total: number };
  dailyLimit: number;
  canSubmit: boolean;
  standings: { name: string; score: number | null; pub: number | null; priv: number | null }[];
  topPerson: { name: string; team: string | null; score: number | null } | null;
  fourPhase: boolean;
  dec: number;
}) {
  const { phase, id, user, registration, isTeam, deadline, quota, dailyLimit, canSubmit, standings, topPerson, fourPhase, dec } = props;

  if (phase === 'ended') {
    if (standings.length === 0) {
      return (
        <div className="rounded-2xl bg-navy-deep p-6">
          <p className="text-sm text-navy-text">Ended</p>
          <p className="mt-1 text-xl font-bold">No valid scores were recorded.</p>
        </div>
      );
    }
    const [first, ...rest] = standings;
    return (
      <div className="flex flex-col gap-3 rounded-2xl bg-amber-strong p-6 shadow-lift">
        <span className="text-sm text-amber-soft">Top of the final leaderboard</span>
        <span className="flex items-baseline justify-between gap-3">
          <span className="min-w-0 break-words text-[1.75rem] font-bold leading-tight tracking-[-0.02em]">{first.name}</span>
          <span className="font-mono text-lg text-amber-soft">{first.score?.toFixed(dec)}</span>
        </span>
        {fourPhase && first.pub !== null && first.priv !== null && (
          <span className="text-sm text-[#E2C8A8]">
            Average of public {first.pub.toFixed(dec)} and private {first.priv.toFixed(dec)}
          </span>
        )}
        <ol className="mt-1 flex flex-col gap-1.5">
          {rest.map((s, i) => (
            <li key={s.name + i} className="flex justify-between gap-3 rounded-xl bg-white/[0.06] px-3.5 py-2.5">
              <span className="min-w-0 truncate">
                <span className={cn('mr-3 font-mono', i === 0 ? 'text-silver' : 'text-bronze')}>{String(i + 2).padStart(2, '0')}</span>
                {s.name}
              </span>
              <span className="shrink-0 font-mono text-[#E2C8A8]">{s.score?.toFixed(dec)}</span>
            </li>
          ))}
        </ol>
        {topPerson && (
          <span className="text-[13px] text-[#E2C8A8]">
            Top individual: <span className="text-white">{topPerson.name}</span>
            {topPerson.team ? ` (${topPerson.team})` : ''} · {topPerson.score?.toFixed(dec)}
          </span>
        )}
      </div>
    );
  }

  const running = phase === 'public_test' || phase === 'private_test';
  const label = phase === 'upcoming' ? 'Registration opens in' : phase === 'registration' ? 'Registration closes in' : phase === 'public_test' ? 'Public test ends in' : 'Private test ends in';

  // Approved and the contest is running → your status + submit
  if (registration?.status === 'approved' && running) {
    return (
      <div className="flex flex-col gap-4 rounded-2xl bg-blue-strong p-6 shadow-lift">
        {deadline && (
          <div>
            <p className="text-sm text-blue-soft">{label}</p>
            <Countdown target={deadline.toISOString()} initial={shortCountdown(deadline) ?? undefined} className="text-[2.25rem] leading-tight tracking-[-0.02em]" />
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-white/[0.07] px-3.5 py-2.5">
            <div className="text-[13px] text-blue-soft">{isTeam ? 'Your team' : 'You'}</div>
            <div className="truncate font-semibold">{isTeam ? registration.team_name ?? 'Your team' : 'Registered'}</div>
          </div>
          <div className="rounded-xl bg-white/[0.07] px-3.5 py-2.5">
            <div className="text-[13px] text-blue-soft">Left today</div>
            <div className="font-mono">
              {Math.max(0, dailyLimit - quota.daily)} / {dailyLimit}
            </div>
          </div>
        </div>
        {canSubmit ? (
          <Link href={`/competitions/${id}/submit`} className={buttonClasses({ variant: 'accent', tone: 'blue', size: 'lg', className: 'w-full' })}>
            Submit predictions
          </Link>
        ) : (
          <p className="rounded-lg bg-black/20 px-3.5 py-2.5 text-sm text-blue-soft">Daily limit reached. It resets at midnight (Vietnam time).</p>
        )}
      </div>
    );
  }

  // Registered but waiting / rejected
  if (registration) {
    const pending = registration.status === 'pending';
    return (
      <div className={cn('flex flex-col gap-3 rounded-2xl p-6 shadow-lift', pending ? 'bg-violet-strong' : 'bg-navy-deep')}>
        <span className={cn('text-sm', pending ? 'text-violet-soft' : 'text-navy-text')}>{pending ? 'Registration pending' : 'Registration not approved'}</span>
        <span className="text-xl font-bold leading-snug">
          {pending
            ? `${isTeam && registration.team_name ? registration.team_name + ' is' : "You're"} waiting for an organiser to approve.`
            : 'An organiser did not approve this registration.'}
        </span>
        {deadline && (
          <span className="text-sm text-white/75">
            {label} <span className="font-mono text-white">{shortCountdown(deadline)}</span>
          </span>
        )}
      </div>
    );
  }

  // Not registered
  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-violet-strong p-6 shadow-lift">
      {deadline && (
        <div>
          <p className="text-sm text-violet-soft">{label}</p>
          <Countdown target={deadline.toISOString()} initial={shortCountdown(deadline) ?? undefined} className="text-[2.25rem] leading-tight tracking-[-0.02em]" />
        </div>
      )}
      {phase === 'upcoming' ? (
        <p className="text-sm text-violet-soft">Registration opens on this page.</p>
      ) : user ? (
        <Link href={`/competitions/${id}/register`} className={buttonClasses({ variant: 'accent', tone: 'violet', size: 'lg', className: 'w-full' })}>
          {phase === 'registration' ? (isTeam ? 'Register a team' : 'Register') : 'Late registration'}
        </Link>
      ) : (
        <>
          <Link href={`/login?redirect=/competitions/${id}`} className={buttonClasses({ variant: 'accent', tone: 'violet', size: 'lg', className: 'w-full' })}>
            Sign in to register
          </Link>
          <p className="text-[13px] text-violet-soft">
            New here?{' '}
            <Link href="/signup" className="font-semibold text-white hover:underline">
              Create an account
            </Link>
            , it takes a minute.
          </p>
        </>
      )}
    </div>
  );
}

function MySubmissions({ rows, isTeam, fourPhase, dec }: { rows: any[]; isTeam: boolean; fourPhase: boolean; dec: number }) {
  if (rows.length === 0) {
    return <p className="rounded-2xl bg-teal-bg px-6 py-5 text-teal-soft">No submissions yet.</p>;
  }
  return (
    <div className="overflow-hidden rounded-2xl bg-bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-[15px]">
          <thead>
            <tr className="text-left text-[13px] text-text-muted">
              <th scope="col" className="py-3.5 pl-4 font-medium sm:pl-6">When</th>
              {isTeam && <th scope="col" className="px-3 py-3.5 font-medium">By</th>}
              <th scope="col" className="px-3 py-3.5 font-medium">File</th>
              {fourPhase && <th scope="col" className="px-3 py-3.5 font-medium">Phase</th>}
              <th scope="col" className="px-3 py-3.5 font-medium">Status</th>
              <th scope="col" className="py-3.5 pl-3 pr-4 text-right font-medium sm:pr-6">Score</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => {
              const err = s.validation_status === 'invalid' ? validationSummary(s.validation_errors) : null;
              const submitter = Array.isArray(s.submitter) ? s.submitter[0] : s.submitter;
              return (
                <tr key={s.id} className="border-t border-border-default align-top">
                  <td className="whitespace-nowrap py-3 pl-4 font-mono text-[13px] text-text-muted sm:pl-6">{vnDateTime(s.submitted_at)}</td>
                  {isTeam && <td className="px-3 py-3">{submitter?.full_name ?? '—'}</td>}
                  <td className="max-w-[220px] px-3 py-3">
                    <span className="block truncate font-mono text-[13px] text-text-tertiary">{s.file_name}</span>
                    {err && <span className="mt-1 block text-[13px] text-amber">{err}</span>}
                  </td>
                  {fourPhase && <td className={cn('px-3 py-3 text-sm font-semibold', s.phase === 'private' ? 'text-amber' : 'text-blue')}>{s.phase === 'private' ? 'Private' : 'Public'}</td>}
                  <td className="px-3 py-3">
                    {s.validation_status === 'valid' ? (
                      <Badge variant="teal">{s.is_best_score ? 'Valid · best' : 'Valid'}</Badge>
                    ) : s.validation_status === 'invalid' ? (
                      <Badge variant="amber">Rejected</Badge>
                    ) : (
                      <Badge variant="blue">Scoring…</Badge>
                    )}
                  </td>
                  <td className="py-3 pl-3 pr-4 text-right font-mono sm:pr-6">{s.score !== null && s.score !== undefined ? Number(s.score).toFixed(dec) : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
