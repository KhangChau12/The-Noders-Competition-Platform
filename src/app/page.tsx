import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { buttonClasses } from '@/components/ui/Button';
import { BandFacts, SectionHead } from '@/components/ui/PageBand';
import { getCompetitionSummaries, getTotalParticipants, getPodium, pickSpotlight, splitTitle, type CompetitionSummary, type PodiumEntry } from '@/lib/data/competitions';
import { getPracticeSummaries, type PracticeSummary } from '@/lib/data/practice';
import { getNextDeadline } from '@/lib/utils/competition';
import { PHASE_UI, DOMAIN_UI, prettyTag } from '@/lib/ui/phase';
import { vnDay, shortCountdown } from '@/lib/ui/dates';
import { metricShortName, metricArrow } from '@/lib/constants';
import { metricDecimals } from '@/lib/leaderboard';
import { cn } from '@/lib/utils/cn';
import { plainText } from '@/lib/ui/text';
import { podiumName } from '@/lib/ui/text';

export default async function HomePage() {
  const supabase = await createClient();
  // Public data is cached; the session check runs alongside it.
  const [{ data: { user } }, competitions, totalCount] = await Promise.all([supabase.auth.getUser(), getCompetitionSummaries(), getTotalParticipants()]);

  const spotlight = pickSpotlight(competitions);
  const ended = competitions.filter((c) => c.phase === 'ended');
  const latestEnded = ended[0] ?? null;
  const [problems, podium, mine] = await Promise.all([
    getPracticeSummaries(undefined, user?.id),
    latestEnded ? getPodium(undefined, latestEnded) : Promise.resolve([] as PodiumEntry[]),
    user ? getMyThings(supabase, user.id) : Promise.resolve(null),
  ]);

  const totalSubmissions = competitions.reduce((s, c) => s + c.submissions, 0);
  const totalParticipants = totalCount ?? competitions.reduce((s, c) => s + c.participants, 0);

  return (
    <>
      {/* ── Hero ── */}
      <section className="band">
        <div className="shell pb-10 pt-12 sm:pb-14 sm:pt-16 lg:pt-24">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:gap-16">
            <div className="min-w-0 flex-1">
              <p className="eyebrow mb-4 sm:mb-5">The Noders Competition Platform</p>
              <h1 className="text-balance text-[2.375rem] font-bold leading-[1.05] tracking-[-0.035em] sm:text-5xl lg:text-[3.5rem]">
                Where PTNK students compete, and practise, in AI.
              </h1>
              <p className="mt-5 max-w-[560px] text-base leading-relaxed text-navy-text sm:text-lg">
                Download the data, upload a CSV of predictions, see your score in seconds. Final rankings come from a test set nobody has seen, so
                only models that generalise win.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/competitions" className={buttonClasses({ size: 'lg', className: 'bg-white text-navy-deep' })}>
                  Browse competitions <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
                <Link href="/practice" className={buttonClasses({ variant: 'outline', size: 'lg', className: 'border-white/50 text-white hover:border-white hover:bg-white/5' })}>
                  Practise anytime
                </Link>
              </div>
            </div>
            <div className="w-full min-w-0 lg:w-[440px] lg:shrink-0">
              {spotlight ? (
                <SpotlightCard c={spotlight} signedIn={!!user} myStatus={mine?.registrations.find((r) => r.competitionId === spotlight.id)?.status} />
              ) : (
                <QuietCard latest={latestEnded} winner={podium[0]} />
              )}
            </div>
          </div>

          <BandFacts
            className="mt-10 sm:mt-12"
            facts={[
              { value: competitions.length, label: 'contests on the platform' },
              { value: totalParticipants.toLocaleString('en-US'), label: 'participants so far', color: 'text-violet-soft' },
              { value: totalSubmissions.toLocaleString('en-US'), label: 'contest submissions scored', color: 'text-blue-soft' },
              { value: problems.length, label: 'practice problems, open all year', color: 'text-teal-soft' },
            ]}
          />
        </div>
      </section>

      {/* ── How a contest runs: a staircase on desktop ── */}
      <section data-reveal className="shell pt-20 sm:pt-24 lg:pt-28" aria-labelledby="how">
        <SectionHead id="how" title="How a contest runs" sub="Each phase has its own colour across the site." />
        <ol data-reveal-group className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 lg:items-start">
          {STEPS.map((s) => (
            <li key={s.n} className={cn('flex min-h-[200px] flex-col gap-2.5 rounded-2xl p-6', s.bg, s.offset)}>
              <span className="flex items-baseline justify-between">
                <span className={cn('text-sm font-semibold', s.text)}>{s.tag}</span>
                <span className={cn('font-mono text-[28px] leading-none opacity-55', s.text)}>{s.n}</span>
              </span>
              <span className="mt-auto text-xl font-bold tracking-[-0.01em]">{s.title}</span>
              <span className="text-[15px] text-text-secondary">{s.body}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Competitions bento ── */}
      {competitions.length > 0 && (
        <section data-reveal className="shell pt-20 sm:pt-24 lg:pt-28" aria-labelledby="comps">
          <SectionHead
            id="comps"
            title="Competitions"
            action={
              <Link href="/competitions" className="link text-[15px]">
                All competitions →
              </Link>
            }
          />
          <div data-reveal-group className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
            {latestEnded && <PodiumCard c={latestEnded} podium={podium} />}
            <div className="flex min-w-0 flex-col gap-4 lg:w-[380px] lg:shrink-0">
              {spotlight && <SmallContestCard c={spotlight} />}
              {ended.slice(1, spotlight ? 2 : 3).map((c) => (
                <SmallContestCard key={c.id} c={c} />
              ))}
              {!spotlight && (
                <div className="flex flex-col gap-1.5 rounded-2xl bg-violet-bg p-6">
                  <span className="text-[13px] font-semibold text-violet">Next contest</span>
                  <span className="text-xl font-bold leading-tight">Announced on Facebook first</span>
                  <a href="https://facebook.com/thenodersptnk" target="_blank" rel="noopener noreferrer" className="text-sm text-violet-muted hover:text-white">
                    Follow The Noders ↗
                  </a>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── One CSV, one score: a tinted band across the page ── */}
      <section data-reveal className="mt-20 bg-[#111A2E] sm:mt-24 lg:mt-28">
        <div className="shell flex flex-col gap-10 py-16 sm:py-20 lg:flex-row lg:items-center lg:gap-16">
          <div className="min-w-0 flex-1">
            <h2 className="h-section">One CSV, one score</h2>
            <p className="mt-4 max-w-[520px] text-[17px] text-text-secondary">
              Every contest and practice problem works the same way. You train wherever you like; the platform only sees your predictions.
            </p>
            <dl className="mt-7 grid grid-cols-1 gap-2.5 text-sm xs:grid-cols-2">
              {CSV_FACTS.map((f) => (
                <div key={f.k} className="rounded-xl bg-blue-bg px-4 py-3.5">
                  <dt className="mb-0.5 font-semibold text-blue">{f.k}</dt>
                  <dd className="text-text-secondary">{f.v}</dd>
                </div>
              ))}
            </dl>
            <Link href="/guide" className="link mt-6 inline-block text-[15px]">
              How scoring works →
            </Link>
          </div>
          <figure className="w-full min-w-0 overflow-hidden rounded-2xl bg-bg-primary shadow-lift lg:w-[460px] lg:shrink-0 lg:-rotate-1">
            <figcaption className="flex justify-between border-b border-border-default px-5 py-3.5 text-[13px] text-text-muted">
              <span className="font-mono text-text-secondary">submission.csv</span>
              <span>Example</span>
            </figcaption>
            <pre className="overflow-x-auto px-5 py-4 font-mono text-sm leading-[1.8] text-text-secondary">
              <span className="text-text-muted">id,prediction</span>
              {'\n1001,6.5\n1002,7.0\n1003,5.5\n'}
              <span className="text-text-disabled">…</span>
            </pre>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 bg-teal-bg px-5 py-4 text-sm">
              <span className="inline-flex items-center gap-2 font-semibold text-teal">
                <Check className="h-4 w-4" strokeWidth={3} aria-hidden /> Valid · scored in seconds
              </span>
              <span className="text-text-secondary">
                Score <span className="font-mono text-text-primary">0.4103</span>
              </span>
              <span className="text-text-secondary">
                Rank <span className="font-mono text-text-primary">#1</span>
              </span>
            </div>
          </figure>
        </div>
      </section>

      {/* ── Practice: asymmetric cards tinted by domain ── */}
      {problems.length > 0 && (
        <section data-reveal className="shell pt-20 sm:pt-24 lg:pt-28" aria-labelledby="prac">
          <SectionHead
            id="prac"
            title="Practice, between contests"
            sub="No deadline, a leaderboard on every problem."
            action={
              <Link href="/practice" className="link text-[15px]">
                All {problems.length} problems →
              </Link>
            }
          />
          <div data-reveal-group className="grid grid-cols-1 gap-4 md:grid-cols-5">
            {problems.slice(0, 4).map((p, i) => (
              <PracticeTile key={p.id} p={p} wide={i === 0 || i === 3} />
            ))}
          </div>
        </section>
      )}

      {/* ── Next step ── */}
      <section data-reveal className="shell pb-24 pt-20 sm:pb-28 sm:pt-24 lg:pt-28">
        {mine ? <YourThings mine={mine} problems={problems} /> : <FirstTime />}
      </section>
    </>
  );
}

/* ───────────────────────── pieces ───────────────────────── */

const STEPS = [
  { n: '01', tag: 'Registration', bg: 'bg-violet-bg', text: 'text-violet', offset: '', title: 'Sign up, team up, register', body: 'Go solo or form a team, depending on the contest. Organisers approve each registration.' },
  { n: '02', tag: 'Public test', bg: 'bg-blue-bg', text: 'text-blue', offset: 'lg:mt-7', title: 'Submit and see your score', body: 'Upload predictions as CSV. Scored in seconds against part of the test set.' },
  { n: '03', tag: 'Private test', bg: 'bg-amber-bg', text: 'text-amber', offset: 'lg:mt-14', title: 'Hidden data decides it', body: 'A final round on unseen data decides the ranking.' },
  { n: '04', tag: 'Results', bg: 'bg-teal-bg', text: 'text-teal', offset: 'lg:mt-[84px]', title: 'Final rank and certificate', body: 'Final rank averages both scores. Certificates are verifiable.' },
];

const CSV_FACTS = [
  { k: 'Format', v: <span className="font-mono">id, prediction</span> },
  { k: 'Limits', v: 'Set per contest, shown on its page' },
  { k: 'Metrics', v: 'F1, accuracy, MAE, RMSE…' },
  { k: 'Rejected?', v: "Doesn't count toward your limit" },
];

function SpotlightCard({ c, signedIn, myStatus }: { c: CompetitionSummary; signedIn: boolean; myStatus?: string }) {
  const ui = PHASE_UI[c.phase];
  const deadline = getNextDeadline(c, c.phase);
  const left = deadline ? shortCountdown(deadline) : null;
  const { code, name } = splitTitle(c.title);
  const verb = c.phase === 'upcoming' ? 'opens in' : c.phase === 'registration' ? 'closes in' : 'ends in';
  const four = c.competition_type === '4-phase';
  const team = c.participation_type === 'team';

  return (
    <Link href={`/competitions/${c.id}`} className={cn('lift flex flex-col gap-3.5 rounded-2xl p-6 text-white shadow-lift sm:p-7', ui.strong)}>
      <span className="flex items-center gap-2.5 text-sm text-white/80">
        <span className={cn('h-2 w-2 rounded-full', ui.fill)} aria-hidden />
        {ui.label}
        {left && (
          <>
            {' · '}
            {verb} <span className="font-mono text-white">{left}</span>
          </>
        )}
      </span>
      <span className="text-[1.5rem] font-bold leading-tight tracking-[-0.015em]">{code ?? name}</span>
      <span className="text-[15px] text-white/75">
        {team ? `Teams of ${c.min_team_size ?? 1}–${c.max_team_size ?? 3}` : 'Individual'} · {four ? '4 phases' : '3 phases'} · {metricShortName(c.scoring_metric)}{' '}
        {metricArrow(c.scoring_metric)}
      </span>
      <PhaseStrip c={c} />
      <span className="flex flex-wrap items-center justify-between gap-3 border-t border-white/15 pt-3.5">
        <span className="text-sm text-white/75">
          {myStatus ? `You're registered · ${myStatus}` : signedIn ? 'Not registered yet' : 'Needs an account'}
        </span>
        <span className={cn(buttonClasses({ variant: 'accent', tone: ui.tone === 'gray' ? 'blue' : ui.tone, size: 'sm' }))}>
          {myStatus ? 'Open contest' : c.phase === 'registration' ? 'Register' : 'Open contest'}
        </span>
      </span>
    </Link>
  );
}

function PhaseStrip({ c }: { c: CompetitionSummary }) {
  const t = (s: string) => new Date(s).getTime();
  const segs = [
    { label: 'Register', from: c.registration_start, to: c.registration_end, fill: 'bg-violet' },
    { label: 'Public test', from: c.public_test_start, to: c.public_test_end, fill: 'bg-blue' },
    ...(c.private_test_start && c.private_test_end ? [{ label: 'Private', from: c.private_test_start, to: c.private_test_end, fill: 'bg-amber' }] : []),
  ];
  const now = Date.now();
  return (
    <span className="flex gap-1 text-[13px] text-white/70">
      {segs.map((s) => {
        const active = now >= t(s.from) && now < t(s.to);
        const done = now >= t(s.to);
        return (
          <span key={s.label} className="min-w-0" style={{ flex: `${Math.max(1, (t(s.to) - t(s.from)) / 86_400_000)} 1 0` }}>
            <span className={cn('block h-1.5 rounded-full', active || done ? s.fill : 'bg-white/20', done && 'opacity-60')} />
            <span className="mt-1.5 block truncate">{s.label}</span>
          </span>
        );
      })}
    </span>
  );
}

function QuietCard({ latest, winner }: { latest: CompetitionSummary | null; winner?: PodiumEntry }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-navy-deep p-6 sm:p-7">
      <span className="flex items-center gap-2.5 text-sm text-navy-text">
        <span className="h-2 w-2 rounded-full bg-[#9FB0CF]" aria-hidden /> No contest running right now
      </span>
      {latest && winner ? (
        <span className="text-xl font-bold leading-snug">
          {splitTitle(latest.title).code ?? latest.title} ended on {vnDay(latest.private_test_end ?? latest.public_test_end)}. {winner.name} came first.
        </span>
      ) : (
        <span className="text-xl font-bold leading-snug">The next contest is announced on Facebook first.</span>
      )}
      <span className="mt-1 flex flex-wrap gap-x-6 gap-y-2 text-[15px] font-semibold">
        <Link href="/practice" className="text-white hover:underline">
          Practise now →
        </Link>
        {latest && (
          <Link href={`/competitions/${latest.id}`} className="band-link">
            Final leaderboard
          </Link>
        )}
      </span>
    </div>
  );
}

function PodiumCard({ c, podium }: { c: CompetitionSummary; podium: PodiumEntry[] }) {
  const { code, name } = splitTitle(c.title);
  const dec = metricDecimals(c.scoring_metric);
  const order = [podium[1], podium[0], podium[2]];
  const heights = ['h-16', 'h-24', 'h-11'];
  const fills = ['bg-[#24345A] text-silver', 'bg-blue-line text-white', 'bg-[#1D2B4B] text-[#9FB0CF]'];

  return (
    <Link href={`/competitions/${c.id}`} className="lift flex min-w-0 flex-1 flex-col gap-5 rounded-2xl bg-blue-bg p-6 text-text-primary sm:p-8">
      <span className="flex flex-wrap justify-between gap-2 text-sm">
        <span className="font-semibold text-blue">
          {code ?? 'Contest'} · Ended {vnDay(c.private_test_end ?? c.public_test_end)}
        </span>
        <span className="text-blue-muted">
          {c.participation_type === 'team' ? 'Teams' : 'Individual'} · {c.competition_type === '4-phase' ? '4 phases' : '3 phases'} ·{' '}
          {metricShortName(c.scoring_metric)} {metricArrow(c.scoring_metric)}
        </span>
      </span>
      <span className="text-[1.5rem] font-bold leading-[1.15] tracking-[-0.02em] sm:text-[1.75rem]">{name}</span>
      <span className="line-clamp-3 max-w-[560px] text-[15px] text-text-secondary">{plainText(c.description)}</span>
      {podium.length >= 3 && (
        <span className="mt-auto grid grid-cols-[1fr_1.25fr_1fr] items-end gap-2.5">
          {order.map((p, i) => (
            <span key={p.rank} className="flex min-w-0 flex-col gap-1.5">
              <span title={p.name} className={cn(podiumName(p.name), 'leading-tight', i === 1 ? 'font-bold' : 'font-semibold')}>{p.name}</span>
              <span className="font-mono text-[13px] text-blue-muted">{p.score?.toFixed(dec)}</span>
              <span className={cn('flex items-start rounded-t-xl rounded-b-sm px-3 py-2 font-mono text-sm', heights[i], fills[i])}>
                {String(p.rank).padStart(2, '0')}
              </span>
            </span>
          ))}
        </span>
      )}
      <span className="flex flex-wrap gap-x-6 gap-y-1 text-[13px] text-blue-muted">
        <span>
          <span className="font-mono text-text-primary">{c.participants}</span> participants
        </span>
        <span>
          <span className="font-mono text-text-primary">{c.submissions.toLocaleString('en-US')}</span> submissions
        </span>
      </span>
    </Link>
  );
}

function SmallContestCard({ c }: { c: CompetitionSummary }) {
  const ui = PHASE_UI[c.phase];
  const { code, name } = splitTitle(c.title);
  const deadline = getNextDeadline(c, c.phase);
  const left = deadline ? shortCountdown(deadline) : null;
  return (
    <Link href={`/competitions/${c.id}`} className={cn('lift flex flex-col gap-1.5 rounded-2xl p-6 text-text-primary', ui.bg)}>
      <span className={cn('text-[13px] font-semibold', ui.text)}>
        {code ? `${code} · ` : ''}
        {c.phase === 'ended' ? `Ended ${vnDay(c.private_test_end ?? c.public_test_end)}` : `${ui.label}${left ? ` · ${left} left` : ''}`}
      </span>
      <span className="text-xl font-bold leading-tight">{name}</span>
      <span className="text-sm text-text-tertiary">
        {c.participation_type === 'team' ? 'Teams' : 'Individual'} · {c.participants} participants
      </span>
    </Link>
  );
}

function PracticeTile({ p, wide }: { p: PracticeSummary; wide: boolean }) {
  const d = DOMAIN_UI[p.domain];
  const dec = metricDecimals(p.scoring_metric);
  const sub = p.tags.filter((t) => !/^(cv|nlp|tabular)/i.test(t.name)).map((t) => prettyTag(t.name))[0] ?? (p.tags[0] ? prettyTag(p.tags[0].name) : null);
  return (
    <Link
      href={`/practice/${p.id}`}
      className={cn('lift flex min-h-[180px] flex-col gap-2.5 rounded-2xl p-6 text-text-primary', d.bg, wide ? 'md:col-span-3 md:min-h-[220px]' : 'md:col-span-2')}
    >
      <span className="flex justify-between gap-3 text-[13px]">
        <span className={cn('font-semibold', d.text)}>
          {d.label}
          {sub ? ` · ${sub}` : ''}
        </span>
        {p.difficulty && <span className="capitalize text-teal">{p.difficulty}</span>}
      </span>
      <span className={cn('mt-auto font-bold leading-[1.2] tracking-[-0.015em]', wide ? 'text-xl sm:text-[1.375rem]' : 'text-lg sm:text-xl')}>{p.title}</span>
      <span className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-[13px] text-text-tertiary">
        <span>
          {metricShortName(p.scoring_metric)} {metricArrow(p.scoring_metric)}
        </span>
        <span>
          {p.topScore !== null ? (
            <>
              top <span className="font-mono text-text-primary">{p.topScore.toFixed(dec)}</span> ·{' '}
            </>
          ) : null}
          {p.solvers} on the board
        </span>
      </span>
    </Link>
  );
}

/* ───────────────────────── signed in / out ───────────────────────── */

interface MyThings {
  registrations: { competitionId: string; title: string; status: string; ended: boolean }[];
  invitations: number;
}

async function getMyThings(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<MyThings> {
  const { data: memberships } = await supabase.from('team_members').select('team_id').eq('user_id', userId);
  const teamIds = ((memberships ?? []) as { team_id: string }[]).map((m) => m.team_id);

  let regQuery = supabase
    .from('registrations')
    .select('competition_id, status, competitions(title, public_test_end, private_test_end, deleted_at)')
    .neq('status', 'rejected');
  regQuery = teamIds.length ? regQuery.or(`user_id.eq.${userId},team_id.in.(${teamIds.join(',')})`) : regQuery.eq('user_id', userId);

  const [{ data: regs }, { count: invitations }] = await Promise.all([
    regQuery,
    supabase.from('team_invitations').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'pending'),
  ]);

  const now = Date.now();
  const registrations = ((regs ?? []) as any[])
    .map((r) => {
      const comp = Array.isArray(r.competitions) ? r.competitions[0] : r.competitions;
      if (!comp || comp.deleted_at) return null;
      const end = new Date(comp.private_test_end ?? comp.public_test_end).getTime();
      return { competitionId: r.competition_id as string, title: comp.title as string, status: r.status as string, ended: end < now };
    })
    .filter(Boolean) as MyThings['registrations'];

  return { registrations, invitations: invitations ?? 0 };
}

function YourThings({ mine, problems }: { mine: MyThings; problems: PracticeSummary[] }) {
  const active = mine.registrations.find((r) => !r.ended);
  const tried = problems.filter((p) => p.yourBest !== null).length;
  const mostTried = [...problems].sort((a, b) => b.solvers - a.solvers)[0];

  const cards = [
    active
      ? { href: `/competitions/${active.competitionId}`, label: active.status === 'approved' ? 'Registered · approved' : 'Registered · pending', value: splitTitle(active.title).code ?? active.title, note: active.status === 'approved' ? 'You can submit while the contest runs.' : 'An organiser reviews it next.', bg: 'bg-violet-bg', color: 'text-violet' }
      : { href: '/competitions', label: 'Competitions', value: 'Not registered right now', note: 'See what is open or coming up.', bg: 'bg-violet-bg', color: 'text-violet' },
    mine.invitations > 0
      ? { href: '/teams', label: 'Team invitation', value: mine.invitations === 1 ? '1 invitation waiting' : `${mine.invitations} invitations waiting`, note: 'Accept or decline on the Teams page.', bg: 'bg-amber-bg', color: 'text-amber' }
      : { href: '/teams', label: 'Teams', value: 'Your teams', note: 'Create one or check who is in.', bg: 'bg-amber-bg', color: 'text-amber' },
    { href: '/practice', label: 'Practice', value: `${tried} of ${problems.length} problems tried`, note: mostTried ? `Most tried: ${mostTried.title}` : 'Problems open all year.', bg: 'bg-teal-bg', color: 'text-teal' },
  ];

  return (
    <div>
      <SectionHead
        title="Your activity"
        action={
          <Link href="/dashboard" className="link text-[15px]">
            Dashboard →
          </Link>
        }
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.label} href={c.href} className={cn('lift flex flex-col gap-1 rounded-2xl p-6 text-text-primary', c.bg)}>
            <span className={cn('text-[13px] font-semibold', c.color)}>{c.label}</span>
            <span className="text-lg font-bold leading-snug">{c.value}</span>
            <span className="text-sm text-text-tertiary">{c.note}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function FirstTime() {
  return (
    <div className="flex flex-col gap-10 rounded-3xl bg-violet-bg p-7 sm:p-10 lg:flex-row lg:gap-16 lg:p-14">
      <div className="min-w-0 flex-1">
        <h2 className="h-section">First time here?</h2>
        <p className="mt-4 max-w-[440px] text-[17px] text-text-secondary">Start with a practice problem; there is no deadline.</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/signup" className={buttonClasses({ variant: 'accent', tone: 'violet', size: 'lg' })}>
            Create account
          </Link>
          <Link href="/guide" className={buttonClasses({ variant: 'outline', size: 'lg' })}>
            How it works
          </Link>
        </div>
      </div>
      <ol className="flex min-w-0 flex-1 flex-col gap-2.5">
        {[
          { n: '01', t: 'Create an account', b: 'Your name goes on the leaderboard and your certificate.' },
          { n: '02', t: 'Make a team, or go solo', b: 'Invite teammates by email; they accept on the Teams page.' },
          { n: '03', t: 'Register, then submit', b: 'Once approved, the Submit button appears on the contest page.' },
        ].map((s) => (
          <li key={s.n} className="flex gap-4 rounded-xl bg-white/[0.05] px-5 py-4">
            <span className="pt-0.5 font-mono text-[13px] text-violet">{s.n}</span>
            <span>
              <span className="block text-[17px] font-semibold">{s.t}</span>
              <span className="block text-[15px] text-text-secondary">{s.b}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
