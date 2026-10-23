import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PageBand, BandFacts, SectionHead } from '@/components/ui/PageBand';
import { buttonClasses } from '@/components/ui/Button';
import { getCompetitionSummaries, getPodium, splitTitle, type CompetitionSummary } from '@/lib/data/competitions';
import { getNextDeadline } from '@/lib/utils/competition';
import { PHASE_UI } from '@/lib/ui/phase';
import { vnRange, shortCountdown } from '@/lib/ui/dates';
import { metricShortName, metricArrow } from '@/lib/constants';
import { cn } from '@/lib/utils/cn';
import Archive, { type ArchiveItem } from './Archive';
import { plainText } from '@/lib/ui/text';

export const metadata = { title: 'Competitions – The Noders Platform' };

export default async function CompetitionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const competitions = await getCompetitionSummaries(supabase);
  const live = competitions.filter((c) => c.phase !== 'ended');
  const ended = competitions.filter((c) => c.phase === 'ended');

  const [podiums, myRegs] = await Promise.all([
    Promise.all(ended.map((c) => getPodium(supabase, c))),
    user ? getMyRegistrationStatuses(supabase, user.id) : Promise.resolve(new Map<string, string>()),
  ]);

  const archive: ArchiveItem[] = ended.map((c, i) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    endedAt: c.private_test_end ?? c.public_test_end,
    participation: c.participation_type,
    fourPhase: c.competition_type === '4-phase',
    metric: c.scoring_metric,
    participants: c.participants,
    submissions: c.submissions,
    podium: podiums[i],
  }));

  const totalParticipants = competitions.reduce((s, c) => s + c.participants, 0);
  const totalSubmissions = competitions.reduce((s, c) => s + c.submissions, 0);

  return (
    <>
      <PageBand
        eyebrow="The Noders Platform"
        title="Competitions"
        description="AI contests with real datasets, hidden test sets and final rankings."
      >
        <BandFacts
          facts={[
            { value: live.length, label: live.length === 1 ? 'open or coming up' : 'open or coming up', color: 'text-violet-soft' },
            { value: competitions.length, label: 'contests run' },
            { value: totalParticipants.toLocaleString('en-US'), label: 'participants in total', color: 'text-blue-soft' },
            { value: totalSubmissions.toLocaleString('en-US'), label: 'submissions scored', color: 'text-teal-soft' },
          ]}
        />
      </PageBand>

      {/* Open now */}
      <section data-reveal className="shell pt-14 sm:pt-[72px]" aria-labelledby="open">
        {live.length > 0 ? (
          <>
            <h2 id="open" className="mb-5 flex items-center gap-2.5 text-base font-semibold text-violet">
              <span className="h-2 w-2 rounded-full bg-violet ring-4 ring-violet/20" aria-hidden />
              Open now
            </h2>
            <div className="flex flex-col gap-5">
              {live.map((c) => (
                <LiveCard key={c.id} c={c} myStatus={myRegs.get(c.id)} signedIn={!!user} />
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-4 rounded-2xl bg-violet-bg p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
            <div>
              <p className="font-semibold">No contest is open right now.</p>
              <p className="text-[15px] text-text-secondary">New contests are announced on The Noders Facebook page. Practice problems remain open.</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-x-6 gap-y-2 text-[15px] font-semibold">
              <a href="https://facebook.com/thenodersptnk" target="_blank" rel="noopener noreferrer" className="text-text-primary hover:underline">
                Get notified ↗
              </a>
              <Link href="/practice" className="text-violet hover:underline">
                Go to practice →
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Past contests */}
      {archive.length > 0 && (
        <section data-reveal className="shell pb-24 pt-20 sm:pb-28 sm:pt-24" aria-labelledby="archive">
          <SectionHead id="archive" title="Past contests" sub="Problem, podium and results for each." />
          <Archive items={archive} />
        </section>
      )}
      {archive.length === 0 && <div className="pb-24" />}
    </>
  );
}

async function getMyRegistrationStatuses(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: memberships } = await supabase.from('team_members').select('team_id').eq('user_id', userId);
  const teamIds = ((memberships ?? []) as { team_id: string }[]).map((m) => m.team_id);
  let q = supabase.from('registrations').select('competition_id, status');
  q = teamIds.length ? q.or(`user_id.eq.${userId},team_id.in.(${teamIds.join(',')})`) : q.eq('user_id', userId);
  const { data } = await q;
  const map = new Map<string, string>();
  for (const r of (data ?? []) as { competition_id: string; status: string }[]) {
    // Prefer an active registration over a rejected one.
    if (!map.has(r.competition_id) || map.get(r.competition_id) === 'rejected') map.set(r.competition_id, r.status);
  }
  return map;
}

function LiveCard({ c, myStatus, signedIn }: { c: CompetitionSummary; myStatus?: string; signedIn: boolean }) {
  const ui = PHASE_UI[c.phase];
  const tone = ui.tone === 'gray' ? 'violet' : ui.tone;
  const { code, name } = splitTitle(c.title);
  const deadline = getNextDeadline(c, c.phase);
  const left = deadline ? shortCountdown(deadline) : null;
  const team = c.participation_type === 'team';
  const label =
    c.phase === 'upcoming' ? 'Registration opens in' : c.phase === 'registration' ? 'Registration closes in' : c.phase === 'public_test' ? 'Public test ends in' : 'Private test ends in';

  let cta: { href: string; text: string };
  if (!signedIn) cta = { href: `/login?redirect=/competitions/${c.id}`, text: c.phase === 'registration' ? 'Sign in to register' : 'Sign in' };
  else if (myStatus === 'approved' && (c.phase === 'public_test' || c.phase === 'private_test')) cta = { href: `/competitions/${c.id}/submit`, text: 'Submit predictions' };
  else if (!myStatus && c.phase === 'registration') cta = { href: `/competitions/${c.id}/register`, text: team ? 'Register a team' : 'Register' };
  else cta = { href: `/competitions/${c.id}`, text: 'Open the contest' };

  return (
    <article className={cn('flex flex-col gap-8 rounded-[18px] p-6 sm:p-8 lg:flex-row lg:gap-12 lg:p-10', ui.bg)}>
      <div className="flex min-w-0 flex-1 flex-col gap-5">
        <div>
          <p className="mb-2 text-sm text-text-tertiary">
            {code ? `${code} · ` : ''}
            {team ? `Teams of ${c.min_team_size ?? 1}–${c.max_team_size ?? 3}` : 'Individual'} · {c.competition_type === '4-phase' ? '4 phases' : '3 phases'}
          </p>
          <h3 className="text-[1.5rem] font-bold leading-[1.15] tracking-[-0.02em] sm:text-[1.75rem] lg:text-[2rem]">
            <Link href={`/competitions/${c.id}`} className="hover:underline hover:decoration-1 hover:underline-offset-4">
              {name}
            </Link>
          </h3>
          <p className="mt-3 line-clamp-3 max-w-[620px] text-text-secondary">{plainText(c.description)}</p>
        </div>
        <PhaseBars c={c} />
        <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <Tile k="Metric" v={`${metricShortName(c.scoring_metric)} ${metricArrow(c.scoring_metric)}`} />
          <Tile k="Per day" v={`${c.daily_submission_limit} submissions`} />
          <Tile k={team ? 'Teams of' : 'Format'} v={team ? `${c.min_team_size ?? 1} – ${c.max_team_size ?? 3}` : 'Individual'} />
          <Tile k="Registered" v={`${c.participants}`} mono />
        </dl>
      </div>

      <div className={cn('flex w-full flex-col gap-4 rounded-2xl p-6 lg:w-[340px] lg:shrink-0', ui.strong)}>
        {left && (
          <div>
            <p className="text-sm text-white/75">{label}</p>
            <p className="mt-1 font-mono text-[2rem] leading-tight tracking-[-0.02em]">{left}</p>
          </div>
        )}
        {myStatus && (
          <p className="rounded-lg bg-black/20 px-3 py-2 text-sm">
            {myStatus === 'approved' ? "You're registered and approved." : myStatus === 'pending' ? 'Your registration is waiting for approval.' : 'Your registration was not approved.'}
          </p>
        )}
        <Link href={cta.href} className={buttonClasses({ variant: 'accent', tone, size: 'lg', className: 'w-full' })}>
          {cta.text}
        </Link>
        <Link href={`/competitions/${c.id}`} className="mt-auto text-[15px] font-semibold text-white hover:underline">
          Read the problem →
        </Link>
      </div>
    </article>
  );
}

function Tile({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="rounded-xl bg-white/[0.05] px-4 py-3">
      <dt className="text-[13px] text-text-muted">{k}</dt>
      <dd className={cn('font-semibold', mono && 'font-mono')}>{v}</dd>
    </div>
  );
}

function PhaseBars({ c }: { c: CompetitionSummary }) {
  const t = (s: string) => new Date(s).getTime();
  const now = Date.now();
  const segs = [
    { label: 'Registration', from: c.registration_start, to: c.registration_end, fill: 'bg-violet', text: 'text-violet' },
    { label: 'Public test', from: c.public_test_start, to: c.public_test_end, fill: 'bg-blue', text: 'text-blue' },
    ...(c.private_test_start && c.private_test_end
      ? [{ label: 'Private test', from: c.private_test_start, to: c.private_test_end, fill: 'bg-amber', text: 'text-amber' }]
      : []),
  ];
  return (
    <ol aria-label="Phases" className="flex flex-col gap-3 sm:flex-row sm:gap-1.5">
      {segs.map((s) => {
        const active = now >= t(s.from) && now < t(s.to);
        const done = now >= t(s.to);
        const pct = active ? Math.round(((now - t(s.from)) / (t(s.to) - t(s.from))) * 100) : done ? 100 : 0;
        return (
          <li key={s.label} className="min-w-0 sm:flex-1" style={{ flexGrow: Math.max(1, (t(s.to) - t(s.from)) / 86_400_000) }}>
            <div className="relative h-1.5 overflow-hidden rounded-full bg-white/[0.12]">
              <div className={cn('absolute inset-y-0 left-0 origin-left animate-grow-x rounded-full', s.fill)} style={{ width: `${pct}%` }} />
            </div>
            <div className={cn('mt-2 text-[13px]', active ? cn('font-semibold', s.text) : 'text-text-muted')}>
              {s.label} · {vnRange(s.from, s.to)}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
