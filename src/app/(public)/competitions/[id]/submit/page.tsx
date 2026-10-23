import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PageBand } from '@/components/ui/PageBand';
import { Countdown } from '@/components/ui/Countdown';
import { Badge } from '@/components/ui/Badge';
import SubmitForm from './SubmitForm';
import { SCORING_METRIC_INFO, metricShortName } from '@/lib/constants';
import { getCompetitionPhase } from '@/lib/utils/competition';
import { metricDecimals } from '@/lib/leaderboard';
import { splitTitle } from '@/lib/data/competitions';
import { vnDayStart, vnNextDayStart, vnDateTime, shortCountdown } from '@/lib/ui/dates';
import { validationSummary } from '@/lib/ui/validation';
import { cn } from '@/lib/utils/cn';

// Auth-dependent data must be fresh on every request.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data } = (await supabase.from('competitions').select('title').eq('id', params.id).maybeSingle()) as { data: { title: string; description?: string | null } | null };
  return {
    title: data ? `Submit · ${data.title} – The Noders Platform` : 'The Noders Platform',
  };
}

export default async function SubmitPage({ params }: Props) {
  const { id } = params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/competitions/${id}/submit`);

  const { data: competition } = (await supabase
    .from('competitions')
    .select(
      'id, title, competition_type, participation_type, registration_start, registration_end, public_test_start, public_test_end, private_test_start, private_test_end, daily_submission_limit, total_submission_limit, max_file_size_mb, scoring_metric'
    )
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()) as { data: any };
  if (!competition) redirect('/competitions');

  const isTeam = competition.participation_type === 'team';

  // Approved registration for the viewer (or one of their teams).
  let teamId: string | null = null;
  let teamName: string | null = null;
  if (isTeam) {
    const { data: memberships } = await supabase.from('team_members').select('team_id').eq('user_id', user.id);
    const ids = ((memberships ?? []) as { team_id: string }[]).map((m) => m.team_id);
    if (ids.length) {
      const { data: reg } = (await supabase
        .from('registrations')
        .select('team_id, teams(name)')
        .eq('competition_id', id)
        .in('team_id', ids)
        .eq('status', 'approved')
        .limit(1)
        .maybeSingle()) as { data: any };
      if (reg) {
        teamId = reg.team_id;
        teamName = (Array.isArray(reg.teams) ? reg.teams[0] : reg.teams)?.name ?? null;
      }
    }
    if (!teamId) redirect(`/competitions/${id}`);
  } else {
    const { data: reg } = await supabase.from('registrations').select('status').eq('competition_id', id).eq('user_id', user.id).maybeSingle();
    if ((reg as { status: string } | null)?.status !== 'approved') redirect(`/competitions/${id}`);
  }

  const col = isTeam ? 'team_id' : 'user_id';
  const val = isTeam ? (teamId as string) : user.id;
  const [{ data: history }, { count: total }, { count: today }] = await Promise.all([
    supabase
      .from('submissions')
      .select('id, file_name, phase, score, validation_status, validation_errors, is_best_score, submitted_at, submitter:users!submissions_submitted_by_fkey(full_name)')
      .eq('competition_id', id)
      .eq(col, val)
      .order('submitted_at', { ascending: false })
      .limit(50),
    supabase.from('submissions').select('id', { count: 'exact', head: true }).eq('competition_id', id).eq(col, val).in('validation_status', ['valid', 'pending']),
    supabase.from('submissions').select('id', { count: 'exact', head: true }).eq('competition_id', id).eq(col, val).in('validation_status', ['valid', 'pending']).gte('submitted_at', vnDayStart().toISOString()),
  ]);

  const phase = getCompetitionPhase(competition);
  const running = phase === 'public_test' || phase === 'private_test';
  const dailyLimit = competition.daily_submission_limit ?? 5;
  const totalLimit = competition.total_submission_limit ?? 0;
  const leftToday = Math.max(0, dailyLimit - (today ?? 0));
  const leftTotal = totalLimit ? Math.max(0, totalLimit - (total ?? 0)) : null;
  const tone = phase === 'private_test' ? 'amber' : 'blue';
  const metricInfo = SCORING_METRIC_INFO[competition.scoring_metric as keyof typeof SCORING_METRIC_INFO];
  const dec = metricDecimals(competition.scoring_metric);
  const { code, name } = splitTitle(competition.title);
  const reset = vnNextDayStart();

  const blockedReason = !running
    ? phase === 'ended'
      ? 'This contest has ended. Submissions are closed.'
      : 'Submissions open when the public test starts.'
    : leftTotal === 0
      ? 'Your total submission limit for this contest is used up.'
      : leftToday === 0
        ? `No submissions left today. The limit resets in ${shortCountdown(reset) ?? 'a moment'} (midnight, Vietnam time).`
        : null;

  return (
    <>
      <PageBand
        crumbs={[{ label: 'Competitions', href: '/competitions' }, { label: code ?? name, href: `/competitions/${id}` }, { label: 'Submit' }]}
        title="Submit predictions"
      >
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
          <div className="band-tile">
            <div className="text-sm text-navy-text">Left today</div>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <span className="font-mono text-2xl sm:text-[1.75rem]">
                {leftToday}
                <span className="text-[#7F93BA]"> / {dailyLimit}</span>
              </span>
              {dailyLimit <= 12 && (
                <span aria-hidden className="flex flex-wrap gap-1">
                  {Array.from({ length: dailyLimit }).map((_, i) => (
                    <span key={i} className={cn('h-2.5 w-2.5 rounded-full', i < leftToday ? (tone === 'amber' ? 'bg-amber' : 'bg-blue') : 'bg-white/20')} />
                  ))}
                </span>
              )}
            </div>
          </div>
          <div className="band-tile">
            <div className="text-sm text-navy-text">Resets in</div>
            <Countdown target={reset.toISOString()} initial={shortCountdown(reset) ?? undefined} className="mt-1 block text-2xl sm:text-[1.75rem]" />
          </div>
          <div className="band-tile">
            <div className="text-sm text-navy-text">Left for the contest</div>
            <div className="mt-1 font-mono text-2xl text-blue-soft sm:text-[1.75rem]">
              {leftTotal === null ? '∞' : leftTotal.toLocaleString('en-US')}
              {leftTotal !== null && <span className="text-[#7F93BA]"> / {totalLimit.toLocaleString('en-US')}</span>}
            </div>
          </div>
          <div className="rounded-xl bg-violet-strong px-5 py-4">
            <div className="text-sm text-violet-soft">{isTeam ? 'Submitting for' : 'Submitting as'}</div>
            <div className="mt-0.5 truncate text-lg font-bold">{isTeam ? teamName : 'Yourself'}</div>
            {isTeam && <div className="text-[13px] text-violet-soft">Limits are shared by the team</div>}
          </div>
        </div>
      </PageBand>

      <section data-reveal className="shell pt-12 sm:pt-14">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1">
            <SubmitForm
              competitionId={id}
              teamId={teamId}
              maxMb={competition.max_file_size_mb ?? 10}
              leftToday={leftToday}
              blockedReason={blockedReason}
              tone={tone}
              metricName={metricInfo?.name ?? metricShortName(competition.scoring_metric)}
              decimals={dec}
            />
          </div>
          <aside className="flex w-full flex-col gap-4 lg:w-[340px] lg:shrink-0">
            <div className="flex flex-col gap-3 rounded-[18px] bg-amber-bg p-6">
              <span className="text-[13px] font-semibold text-amber">What the file needs</span>
              <ul className="flex flex-col gap-2 text-[15px]">
                <li className="rounded-xl bg-white/[0.05] px-3.5 py-2.5">
                  Header row: <span className="font-mono text-amber-soft">id,prediction</span>
                </li>
                <li className="rounded-xl bg-white/[0.05] px-3.5 py-2.5">One row per test id, none missing, no duplicates</li>
                <li className="rounded-xl bg-white/[0.05] px-3.5 py-2.5">.csv only, up to {competition.max_file_size_mb ?? 10} MB</li>
              </ul>
              <Link href={`/competitions/${id}#problem`} className="text-sm font-semibold text-amber hover:underline">
                Re-read the problem →
              </Link>
            </div>
            <div className="rounded-[18px] bg-bg-elevated p-6 text-[15px] text-text-secondary">
              Rejected files don&apos;t count toward your limit. Only {isTeam ? "your team's" : 'your'} best valid score shows on the leaderboard.
            </div>
          </aside>
        </div>
      </section>

      <section data-reveal className="shell pb-24 pt-16 sm:pb-28 sm:pt-20">
        <h2 className="h-section mb-5">{isTeam ? 'Team submissions' : 'My submissions'}</h2>
        {(history ?? []).length === 0 ? (
          <p className="rounded-2xl bg-bg-elevated px-6 py-5 text-text-tertiary">Nothing yet. Your first upload will show here.</p>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-[15px]">
                <thead>
                  <tr className="text-left text-[13px] text-text-muted">
                    <th scope="col" className="py-3.5 pl-4 font-medium sm:pl-6">When</th>
                    {isTeam && <th scope="col" className="px-3 py-3.5 font-medium">By</th>}
                    <th scope="col" className="px-3 py-3.5 font-medium">File</th>
                    <th scope="col" className="px-3 py-3.5 font-medium">Status</th>
                    <th scope="col" className="py-3.5 pl-3 pr-4 text-right font-medium sm:pr-6">{metricShortName(competition.scoring_metric)}</th>
                  </tr>
                </thead>
                <tbody>
                  {(history as any[]).map((s) => {
                    const err = s.validation_status === 'invalid' ? validationSummary(s.validation_errors) : null;
                    const by = Array.isArray(s.submitter) ? s.submitter[0] : s.submitter;
                    return (
                      <tr key={s.id} className="border-t border-border-default align-top">
                        <td className="whitespace-nowrap py-3 pl-4 font-mono text-[13px] text-text-muted sm:pl-6">{vnDateTime(s.submitted_at)}</td>
                        {isTeam && <td className="px-3 py-3">{by?.full_name ?? '—'}</td>}
                        <td className="max-w-[240px] px-3 py-3">
                          <span className="block truncate font-mono text-[13px] text-text-tertiary">{s.file_name}</span>
                          {err && <span className="mt-1 block text-[13px] text-amber">{err}</span>}
                        </td>
                        <td className="px-3 py-3">
                          {s.validation_status === 'valid' ? (
                            <Badge variant="teal">{s.is_best_score ? 'Valid · best' : 'Valid'}</Badge>
                          ) : s.validation_status === 'invalid' ? (
                            <Badge variant="amber">Rejected</Badge>
                          ) : (
                            <Badge variant="blue">Scoring…</Badge>
                          )}
                          {competition.competition_type === '4-phase' && (
                            <span className={cn('ml-2 text-[13px]', s.phase === 'private' ? 'text-amber' : 'text-blue')}>{s.phase}</span>
                          )}
                        </td>
                        <td className="py-3 pl-3 pr-4 text-right font-mono sm:pr-6">{s.score !== null ? Number(s.score).toFixed(dec) : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
