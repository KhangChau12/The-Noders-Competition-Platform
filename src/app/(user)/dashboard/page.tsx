import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PageBand } from '@/components/ui/PageBand';
import { Countdown } from '@/components/ui/Countdown';
import InvitationActions from '@/components/teams/InvitationActions';
import OnboardingSteps, { type Step } from './OnboardingSteps';
import { getMyTeams, getMyInvitations, getMyRegistrations, type MyRegistration } from '@/lib/data/user';
import { getPracticeSummaries } from '@/lib/data/practice';
import { splitTitle } from '@/lib/data/competitions';
import { getNextDeadline } from '@/lib/utils/competition';
import { PHASE_UI } from '@/lib/ui/phase';
import { shortCountdown, timeAgo } from '@/lib/ui/dates';
import { metricDecimals } from '@/lib/leaderboard';
import { cn } from '@/lib/utils/cn';

// Auth-dependent data must be fresh on every request.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = { title: 'Dashboard – The Noders Platform' };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/dashboard');

  const [{ data: profile }, teams, invitations, problems] = await Promise.all([
    supabase.from('users').select('full_name, bio').eq('id', user.id).maybeSingle(),
    getMyTeams(supabase, user.id),
    getMyInvitations(supabase, user.id),
    getPracticeSummaries(supabase, user.id),
  ]);
  const registrations = await getMyRegistrations(
    supabase,
    user.id,
    teams.map((t) => t.id)
  );

  const p = profile as { full_name: string | null; bio: string | null } | null;
  const firstName = (p?.full_name ?? '').trim().split(/\s+/).pop() || 'there';

  // Open contest to point newcomers at (registration open or running).
  const { data: openComp } = (await supabase
    .from('competitions')
    .select('id, registration_end')
    .is('deleted_at', null)
    .gt('registration_end', new Date().toISOString())
    .order('registration_end', { ascending: true })
    .limit(1)
    .maybeSingle()) as { data: { id: string } | null };

  const tried = problems.filter((x) => x.yourBest !== null);
  const starter = [...problems].sort((a, b) => b.solvers - a.solvers)[0];

  const steps: Step[] = [
    { n: 1, title: 'Create your account', short: '', body: '', how: [], time: '1 min', cta: { href: '/profile', label: 'Profile' }, tone: 'teal', done: true, doneNote: 'done' },
    {
      n: 2,
      title: 'Try a practice problem',
      short: 'No deadline. Learn how submission works.',
      body: 'Practice problems have no deadline and use the same submission flow as contests.',
      how: ['Download the dataset from the problem page.', 'Train any model you like. A Colab notebook is enough.', 'Upload a CSV with two columns, id and prediction. Your score appears in seconds.'],
      time: '20 min',
      cta: { href: starter ? `/practice/${starter.id}` : '/practice', label: starter ? `Open ${starter.title}` : 'Browse practice' },
      tone: 'teal',
      done: tried.length > 0,
      doneNote: `you have a score on ${tried.length} problem${tried.length > 1 ? 's' : ''}`,
    },
    {
      n: 3,
      title: 'Join or create a team',
      short: 'Required for team contests only.',
      body: 'Team contests are entered by teams. Members share the daily submission limit.',
      how: ['Create a team. You become its leader.', 'Invite friends by the email they signed up with.', 'Or wait: if someone invites you, it shows up here and on the Teams page.'],
      time: '2 min',
      cta: { href: '/teams', label: 'Go to Teams' },
      tone: 'amber',
      done: teams.length > 0,
      doneNote: `you're in ${teams.length} team${teams.length > 1 ? 's' : ''}`,
    },
    {
      n: 4,
      title: 'Register for a contest',
      short: 'Registration requires organiser approval.',
      body: 'Register before the contest starts. Once approved, you can submit from the contest page.',
      how: ['Open a contest that says “Registration open”.', 'Read the problem, then register yourself or your team.', 'Wait for approval. The contest page tells you when it’s done.'],
      time: '1 min',
      cta: { href: openComp ? `/competitions/${openComp.id}` : '/competitions', label: openComp ? 'Open the contest' : 'See competitions' },
      tone: 'violet',
      done: registrations.length > 0,
      doneNote: 'registered',
    },
  ];
  const allDone = steps.every((s) => s.done);
  const doneCount = steps.filter((s) => s.done).length;

  // Next deadline among contests you're in.
  const active = registrations.filter((r) => r.phase !== 'ended' && r.status !== 'rejected');
  const nextUp = active
    .map((r) => ({ r, at: getNextDeadline(r.competition, r.phase) }))
    .filter((x) => x.at)
    .sort((a, b) => a.at!.getTime() - b.at!.getTime())[0];

  const pendingRegs = registrations.filter((r) => r.status === 'pending' && r.phase !== 'ended');
  const hasNeeds = invitations.length > 0 || pendingRegs.length > 0 || !p?.bio;

  return (
    <>
      <PageBand
        eyebrow="Dashboard"
        title={allDone ? `Hi, ${firstName}` : `Welcome, ${firstName}`}
        description={
          allDone ? (
            invitations.length + pendingRegs.length > 0 ? `${invitations.length + pendingRegs.length} thing${invitations.length + pendingRegs.length > 1 ? 's' : ''} below need${invitations.length + pendingRegs.length > 1 ? '' : 's'} you.` : 'Everything you’re part of on the platform.'
          ) : (
            'Complete four short steps to get started.'
          )
        }
        aside={
          nextUp ? (
            <NextUp r={nextUp.r} at={nextUp.at!} />
          ) : !allDone ? (
            <div className="flex flex-col gap-2.5 rounded-2xl bg-navy-deep p-5 sm:p-6">
              <span className="text-sm text-blue-soft">{doneCount} of 4 done</span>
              <span aria-hidden className="grid grid-cols-4 gap-1.5">
                {steps.map((s) => (
                  <span key={s.n} className={cn('h-2 rounded-full', s.done ? 'bg-teal' : 'bg-white/15')} />
                ))}
              </span>
            </div>
          ) : undefined
        }
      />

      {!allDone && (
        <section data-reveal className="shell pt-12 sm:pt-14">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">
            <div className="min-w-0 flex-1">
              <OnboardingSteps steps={steps} />
            </div>
            <aside aria-labelledby="words" className="flex w-full flex-col gap-3.5 rounded-[18px] bg-bg-surface p-6 lg:w-[340px] lg:shrink-0">
              <h2 id="words" className="h-card">
                Words you&apos;ll see here
              </h2>
              <dl className="flex flex-col gap-3 text-[15px]">
                {[
                  ['text-blue', 'Public test', 'You upload predictions and get a score right away, on part of the test data.'],
                  ['text-amber', 'Private test', 'A final round on data nobody has seen. It decides the final ranking.'],
                  ['text-violet', 'Registration', 'Sign up for a contest before it starts. An organiser approves it.'],
                  ['text-teal', 'Practice', 'Problems with no deadline. Good for learning; nothing is at stake.'],
                ].map(([c, k, v]) => (
                  <div key={k}>
                    <dt className={cn('font-semibold', c)}>{k}</dt>
                    <dd className="text-text-tertiary">{v}</dd>
                  </div>
                ))}
              </dl>
              <Link href="/guide" className="link text-sm">
                How scoring works →
              </Link>
            </aside>
          </div>
        </section>
      )}

      <div className={cn('flex flex-col gap-12 pb-24 pt-12 sm:pt-14', allDone ? 'shell-text' : 'shell')}>
        {hasNeeds && (allDone || invitations.length > 0 || pendingRegs.length > 0) && (
          <section data-reveal aria-labelledby="needs">
            <h2 id="needs" className="h-section mb-5">
              Needs you
            </h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {invitations.map((i) => (
                <div key={i.id} className="flex flex-col gap-2 rounded-2xl bg-amber-bg p-5 sm:p-6">
                  <span className="text-[13px] font-semibold text-amber">Team invitation · {timeAgo(i.invitedAt)}</span>
                  <span className="text-lg font-bold leading-snug">
                    {i.inviter} invited you to {i.teamName}
                  </span>
                  <span className="text-sm text-amber-muted">
                    {i.memberCount} member{i.memberCount === 1 ? '' : 's'}
                  </span>
                  <div className="mt-1.5">
                    <InvitationActions invitationId={i.id} teamName={i.teamName} size="sm" />
                  </div>
                </div>
              ))}
              {pendingRegs.map((r) => (
                <Link key={r.competitionId} href={`/competitions/${r.competitionId}`} className="lift flex flex-col gap-2 rounded-2xl bg-violet-bg p-5 text-text-primary sm:p-6">
                  <span className="text-[13px] font-semibold text-violet">Registration pending</span>
                  <span className="text-lg font-bold leading-snug">{splitTitle(r.title).code ?? r.title}</span>
                  <span className="text-sm text-violet-muted">{r.teamName ? `With ${r.teamName}. ` : ''}An organiser reviews it next. Nothing to do yet.</span>
                </Link>
              ))}
              {allDone && !p?.bio && (
                <Link href="/profile" className="lift flex flex-col gap-2 rounded-2xl bg-bg-elevated p-5 text-text-primary sm:p-6">
                  <span className="text-[13px] font-semibold text-text-tertiary">Profile</span>
                  <span className="text-lg font-bold leading-snug">Add a short bio</span>
                  <span className="text-sm text-text-muted">It shows on your teams. One line is enough.</span>
                </Link>
              )}
            </div>
          </section>
        )}

        {registrations.length > 0 && (
          <section data-reveal aria-labelledby="comps">
            <ListHead id="comps" title="Your competitions" href="/competitions" link="All competitions" />
            <ul className="overflow-hidden rounded-2xl bg-bg-surface">
              {registrations.map((r) => (
                <RegRow key={r.competitionId} r={r} />
              ))}
            </ul>
          </section>
        )}

        {(allDone || tried.length > 0) && (
          <section data-reveal aria-labelledby="prac">
            <ListHead id="prac" title="Practice" href="/practice" link="All problems" linkClass="text-teal" />
            {tried.length === 0 ? (
              <Link href={starter ? `/practice/${starter.id}` : '/practice'} className="lift flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-teal-bg px-5 py-4 text-text-primary">
                <span className="font-semibold">You haven&apos;t tried a problem yet</span>
                {starter && <span className="text-sm text-teal-soft">Start with {starter.title} →</span>}
              </Link>
            ) : (
              <ul className="overflow-hidden rounded-2xl bg-teal-bg">
                {tried.map((x) => (
                  <li key={x.id} className="border-t border-white/[0.06] first:border-t-0">
                    <Link href={`/practice/${x.id}`} className="flex flex-wrap items-center gap-x-5 gap-y-1 px-5 py-4 text-text-primary hover:bg-white/[0.03]">
                      <span className="min-w-0 flex-1 font-semibold">{x.title}</span>
                      <span className="text-sm text-teal-soft">
                        #{x.yourRank} of {x.solvers} · <span className="font-mono text-text-primary">{x.yourBest?.toFixed(metricDecimals(x.scoring_metric))}</span>
                      </span>
                    </Link>
                  </li>
                ))}
                <li className="border-t border-white/[0.06] px-5 py-3 text-sm text-teal-muted">
                  {tried.length} of {problems.length} problems tried
                </li>
              </ul>
            )}
          </section>
        )}

        {teams.length > 0 && (
          <section data-reveal aria-labelledby="teams">
            <ListHead id="teams" title="Teams" href="/teams" link="Manage teams" linkClass="text-amber" />
            <ul className="overflow-hidden rounded-2xl bg-bg-surface">
              {teams.map((t) => (
                <li key={t.id} className="border-t border-border-default first:border-t-0">
                  <Link href={`/teams/${t.id}`} className="flex flex-wrap items-center gap-x-5 gap-y-1 px-5 py-4 text-text-primary hover:bg-white/[0.03]">
                    <span className="min-w-0 flex-1 font-semibold">{t.name}</span>
                    <span className="text-sm text-text-tertiary">
                      {t.isLeader ? 'You lead' : 'Member'} · {t.members.length} member{t.members.length === 1 ? '' : 's'}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}

function ListHead({ id, title, href, link, linkClass = 'text-blue' }: { id: string; title: string; href: string; link: string; linkClass?: string }) {
  return (
    <div className="mb-5 flex items-baseline justify-between gap-4">
      <h2 id={id} className="h-section">
        {title}
      </h2>
      <Link href={href} className={cn('text-sm font-semibold hover:underline', linkClass)}>
        {link}
      </Link>
    </div>
  );
}

function RegRow({ r }: { r: MyRegistration }) {
  const ui = PHASE_UI[r.phase];
  const status = r.status === 'approved' ? 'Approved' : r.status === 'pending' ? 'Pending' : 'Not approved';
  return (
    <li className="border-t border-border-default first:border-t-0">
      <Link href={`/competitions/${r.competitionId}`} className="flex flex-wrap items-center gap-x-5 gap-y-1 px-5 py-4 text-text-primary hover:bg-white/[0.03]">
        <span className={cn('h-2 w-2 shrink-0 rounded-full', ui.fill)} aria-hidden />
        <span className="min-w-0 flex-1 font-semibold">{splitTitle(r.title).code ?? r.title}</span>
        <span className="text-sm text-text-tertiary">
          {ui.label} · {status}
          {r.teamName ? ` · ${r.teamName}` : ''}
        </span>
      </Link>
    </li>
  );
}

function NextUp({ r, at }: { r: MyRegistration; at: Date }) {
  const label = r.phase === 'registration' ? 'registration closes' : r.phase === 'upcoming' ? 'registration opens' : r.phase === 'public_test' ? 'public test ends' : 'private test ends';
  return (
    <Link href={`/competitions/${r.competitionId}`} className="lift flex flex-col gap-2 rounded-2xl bg-violet-strong p-5 text-white shadow-lift sm:p-6">
      <span className="text-sm text-violet-soft">Next up</span>
      <Countdown target={at.toISOString()} initial={shortCountdown(at) ?? undefined} className="text-[2rem] leading-tight" />
      <span className="text-lg font-bold">
        {splitTitle(r.title).code ?? r.title}: {label}
      </span>
      <span className="text-sm text-violet-soft">
        {r.status === 'approved' ? 'You’re approved.' : r.status === 'pending' ? 'Waiting for approval. Nothing to do yet.' : 'Registration not approved.'}
        {r.teamName ? ` With ${r.teamName}.` : ''}
      </span>
    </Link>
  );
}
