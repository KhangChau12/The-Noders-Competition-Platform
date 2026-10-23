import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PageBand, BandFacts } from '@/components/ui/PageBand';
import { buttonClasses } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import RegistrationActions from './RegistrationActions';
import { getCompetitionPhase, getNextDeadline } from '@/lib/utils/competition';
import { splitTitle } from '@/lib/data/competitions';
import { PHASE_UI } from '@/lib/ui/phase';
import { vnDateTime, timeAgo, shortCountdown } from '@/lib/ui/dates';
import { cn } from '@/lib/utils/cn';

// Auth-dependent data must be fresh on every request.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = { title: 'Admin – The Noders Platform' };

const one = (v: any) => (Array.isArray(v) ? v[0] ?? null : v ?? null);

export default async function AdminDashboardPage() {
  // Auth + role are enforced by the admin layout.
  const supabase = await createClient();
  const now = new Date();
  const stuckBefore = new Date(now.getTime() - 10 * 60 * 1000).toISOString();

  const [
    { count: totalUsers },
    { count: totalSubmissions },
    { count: totalPractice },
    { data: comps },
    { data: pending },
    { data: recent },
    { data: datasets },
    { data: certs },
    { count: stuck },
  ] = (await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase.from('submissions').select('id', { count: 'exact', head: true }),
    supabase.from('practice_problems').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    supabase
      .from('competitions')
      .select('id, title, competition_type, participation_type, min_team_size, max_team_size, registration_start, registration_end, public_test_start, public_test_end, private_test_start, private_test_end')
      .is('deleted_at', null),
    supabase
      .from('registrations')
      .select('id, registered_at, competition_id, user:users!registrations_user_id_fkey(full_name, email), team:teams(id, name)')
      .eq('status', 'pending')
      .order('registered_at', { ascending: true }),
    supabase
      .from('submissions')
      .select('id, score, submitted_at, validation_status, competition_id, team:teams(name), submitter:users!submissions_submitted_by_fkey(full_name)')
      .order('submitted_at', { ascending: false })
      .limit(10),
    supabase.from('test_datasets').select('competition_id, phase'),
    supabase.from('certificates').select('competition_id'),
    supabase.from('submissions').select('id', { count: 'exact', head: true }).eq('validation_status', 'pending').lt('submitted_at', stuckBefore),
  ])) as any[];

  const compList = ((comps ?? []) as any[]).map((c) => ({ ...c, phase: getCompetitionPhase(c, now) }));
  const compById = new Map(compList.map((c) => [c.id, c]));
  const live = compList.filter((c) => c.phase !== 'ended' && c.phase !== 'upcoming');

  // Team sizes for pending team registrations.
  const teamIds = ((pending ?? []) as any[]).map((r) => one(r.team)?.id).filter(Boolean);
  const { data: tm } = teamIds.length ? await supabase.from('team_members').select('team_id').in('team_id', teamIds) : { data: [] };
  const sizeOf = (id: string) => ((tm ?? []) as { team_id: string }[]).filter((m) => m.team_id === id).length;

  // Group the queue by contest.
  const queue = new Map<string, any[]>();
  ((pending ?? []) as any[]).forEach((r) => {
    if (!compById.has(r.competition_id)) return;
    queue.set(r.competition_id, [...(queue.get(r.competition_id) ?? []), r]);
  });
  const pendingCount = Array.from(queue.values()).reduce((n, l) => n + l.length, 0);

  // Checklist: things that will bite if nobody looks.
  const hasKey = (cid: string, phase: 'public' | 'private') => ((datasets ?? []) as any[]).some((d) => d.competition_id === cid && d.phase === phase);
  const certCount = (cid: string) => ((certs ?? []) as any[]).filter((c) => c.competition_id === cid).length;
  const checks: { tone: 'amber' | 'violet' | 'blue'; text: string; href: string; cta: string }[] = [];
  compList.forEach((c) => {
    const short = splitTitle(c.title).code ?? c.title;
    if (c.phase !== 'ended' && !hasKey(c.id, 'public')) checks.push({ tone: 'amber', text: `${short}: no public answer key uploaded. Submissions can’t be scored.`, href: `/admin/competitions/${c.id}/edit`, cta: 'Upload' });
    if (c.competition_type === '4-phase' && c.phase !== 'ended' && !hasKey(c.id, 'private')) checks.push({ tone: 'amber', text: `${short}: no private answer key yet.`, href: `/admin/competitions/${c.id}/edit`, cta: 'Upload' });
    if (c.phase === 'ended' && certCount(c.id) === 0 && now.getTime() - new Date(c.private_test_end ?? c.public_test_end).getTime() < 90 * 864e5)
      checks.push({ tone: 'violet', text: `${short} has ended. No certificates issued yet.`, href: '/admin/certificates/upload', cta: 'Issue' });
  });
  if ((stuck ?? 0) > 0) checks.push({ tone: 'blue', text: `${stuck} submission${stuck === 1 ? ' has' : 's have'} been scoring for over 10 minutes. Check the validate-csv function.`, href: '#recent', cta: 'See' });

  return (
    <>
      <PageBand
        eyebrow="Admin"
        title={pendingCount > 0 ? `${pendingCount} registration${pendingCount === 1 ? '' : 's'} to review.` : 'All caught up.'}
        description={live.length > 0 ? `${live.length} contest${live.length === 1 ? ' is' : 's are'} open right now.` : 'No contest is open right now.'}
        aside={
          <div className="flex flex-col gap-3 rounded-2xl bg-navy-deep p-5 sm:p-6">
            <span className="text-sm text-navy-text">Create</span>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 lg:grid-cols-1">
              <Link href="/admin/competitions/create" className={buttonClasses({ variant: 'primary', className: 'w-full' })}>
                New competition
              </Link>
              <Link href="/admin/practice/create" className={buttonClasses({ variant: 'outline', className: 'w-full border-white/25' })}>
                New practice problem
              </Link>
              <Link href="/admin/certificates/upload" className={buttonClasses({ variant: 'outline', className: 'w-full border-white/25' })}>
                Upload certificate
              </Link>
            </div>
          </div>
        }
      >
        <BandFacts
          facts={[
            { value: compList.length, label: `Competitions · ${live.length} open` },
            { value: totalUsers ?? 0, label: 'Users' },
            { value: totalSubmissions ?? 0, label: 'Contest submissions' },
            { value: totalPractice ?? 0, label: 'Practice problems', color: 'text-teal' },
          ]}
        />
      </PageBand>

      <div className="shell flex flex-col gap-14 pt-12 sm:pt-14">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-12">
          <section aria-labelledby="queue" className="min-w-0 flex-1">
            <h2 id="queue" className="h-section mb-5">
              Registrations
            </h2>
            {pendingCount === 0 ? (
              <p className="rounded-2xl bg-teal-bg px-6 py-5 text-teal-soft">Nothing waiting. New registrations show up here, oldest first.</p>
            ) : (
              <div className="flex flex-col gap-5">
                {Array.from(queue.entries()).map(([cid, regs]) => {
                  const c = compById.get(cid)!;
                  const ui = PHASE_UI[c.phase as keyof typeof PHASE_UI];
                  const isTeam = c.participation_type === 'team';
                  return (
                    <div key={cid} className="overflow-hidden rounded-[18px] bg-bg-surface">
                      <div className={cn('flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 py-3.5 sm:px-6', ui.bg)}>
                        <Link href={`/competitions/${cid}`} className="font-semibold hover:underline">
                          {splitTitle(c.title).code ?? c.title}
                        </Link>
                        <span className={cn('text-sm', ui.text)}>
                          {ui.label} · {regs.length} waiting
                          {isTeam && (c.min_team_size || c.max_team_size) ? ` · teams of ${c.min_team_size ?? 1}–${c.max_team_size ?? '∞'}` : ''}
                        </span>
                      </div>
                      <ul>
                        {regs.map((r) => {
                          const team = one(r.team);
                          const u = one(r.user);
                          const size = team ? sizeOf(team.id) : 0;
                          const off = team && ((c.min_team_size && size < c.min_team_size) || (c.max_team_size && size > c.max_team_size));
                          return (
                            <li key={r.id} className="flex flex-col gap-3 border-t border-border-default px-5 py-4 first:border-t-0 sm:flex-row sm:items-center sm:gap-6 sm:px-6">
                              <span className="min-w-0 flex-1">
                                <span className="block truncate font-semibold">{team ? team.name : u?.full_name || u?.email || 'Unknown'}</span>
                                <span className="block truncate text-sm text-text-muted">
                                  {team ? (
                                    <span className={off ? 'text-amber' : undefined}>
                                      Team of {size}
                                      {off ? ' (outside the size limit)' : ''}
                                    </span>
                                  ) : (
                                    u?.email
                                  )}{' '}
                                  · {timeAgo(r.registered_at)}
                                </span>
                              </span>
                              <RegistrationActions registrationId={r.id} />
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <aside aria-labelledby="checks" className="flex w-full flex-col gap-4 lg:w-[380px] lg:shrink-0">
            <h2 id="checks" className="h-section">
              Checklist
            </h2>
            {checks.length === 0 ? (
              <p className="rounded-2xl bg-bg-surface px-6 py-5 text-text-tertiary">Answer keys are in place and nothing is stuck.</p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {checks.map((k, i) => (
                  <li key={i} className={cn('flex items-start gap-4 rounded-2xl px-5 py-4', k.tone === 'amber' ? 'bg-amber-bg' : k.tone === 'violet' ? 'bg-violet-bg' : 'bg-blue-bg')}>
                    <span className="min-w-0 flex-1 text-[15px] text-text-secondary">{k.text}</span>
                    <Link href={k.href} className={cn('shrink-0 text-sm font-semibold hover:underline', k.tone === 'amber' ? 'text-amber' : k.tone === 'violet' ? 'text-violet' : 'text-blue')}>
                      {k.cta} →
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {live.length > 0 && (
              <div className="flex flex-col gap-1 rounded-2xl bg-bg-surface p-5">
                <span className="mb-1 text-[13px] font-semibold text-text-tertiary">Open contests</span>
                {live.map((c) => {
                  const at = getNextDeadline(c, c.phase);
                  const ui = PHASE_UI[c.phase as keyof typeof PHASE_UI];
                  return (
                    <Link key={c.id} href={`/admin/competitions/${c.id}/edit`} className="flex items-center gap-3 rounded-lg py-2 text-text-primary hover:text-white">
                      <span className={cn('h-2 w-2 shrink-0 rounded-full', ui.fill)} aria-hidden />
                      <span className="min-w-0 flex-1 truncate font-semibold">{splitTitle(c.title).code ?? c.title}</span>
                      <span className="shrink-0 text-sm text-text-muted">
                        {ui.label}
                        {at ? ` · ${shortCountdown(at)}` : ''}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </aside>
        </div>

        <section id="recent" aria-labelledby="recent-h" className="scroll-mt-[100px] pb-24">
          <h2 id="recent-h" className="h-section mb-5">
            Recent submissions
          </h2>
          {(recent ?? []).length === 0 ? (
            <p className="rounded-2xl bg-bg-elevated px-6 py-5 text-text-tertiary">No submissions yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl bg-bg-surface">
              <table className="w-full min-w-[640px] text-left text-[15px]">
                <thead className="bg-bg-elevated text-sm text-text-tertiary">
                  <tr>
                    <th className="px-5 py-3 font-semibold">When</th>
                    <th className="px-5 py-3 font-semibold">Who</th>
                    <th className="px-5 py-3 font-semibold">Contest</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 text-right font-semibold">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {(recent as any[]).map((s) => {
                    const c = compById.get(s.competition_id);
                    return (
                      <tr key={s.id}>
                        <td className="whitespace-nowrap px-5 py-3 font-mono text-[13px] text-text-muted">{vnDateTime(s.submitted_at)}</td>
                        <td className="px-5 py-3">
                          {one(s.submitter)?.full_name ?? 'Unknown'}
                          {one(s.team)?.name && <span className="text-text-muted"> · {one(s.team).name}</span>}
                        </td>
                        <td className="px-5 py-3 text-text-secondary">{c ? splitTitle(c.title).code ?? c.title : '—'}</td>
                        <td className="px-5 py-3">
                          {s.validation_status === 'valid' ? <Badge variant="teal">Valid</Badge> : s.validation_status === 'invalid' ? <Badge variant="amber">Rejected</Badge> : <Badge variant="blue">Scoring</Badge>}
                        </td>
                        <td className="px-5 py-3 text-right font-mono">{s.score !== null ? Number(s.score).toFixed(4) : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
