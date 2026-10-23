import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PageBand, BandFacts } from '@/components/ui/PageBand';
import { buttonClasses } from '@/components/ui/Button';
import { getCompetitionPhase } from '@/lib/utils/competition';
import { PHASE_UI } from '@/lib/ui/phase';
import { cn } from '@/lib/utils/cn';

// Auth-dependent data must be fresh on every request.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = { title: 'Certificates – Admin' };

export default async function AdminCertificatesPage() {
  // Auth + role are enforced by the admin layout.
  const supabase = await createClient();
  const [{ data: comps }, { data: certs }, { data: prefixes }] = (await Promise.all([
    supabase
      .from('competitions')
      .select('id, title, registration_start, registration_end, public_test_end, private_test_start, private_test_end')
      .is('deleted_at', null)
      .order('registration_start', { ascending: false }),
    supabase.from('certificates').select('competition_id'),
    supabase.from('certificate_prefixes').select('competition_id, prefix'),
  ])) as [{ data: any[] | null }, { data: { competition_id: string }[] | null }, { data: { competition_id: string; prefix: string }[] | null }];

  const now = new Date();
  const rows = (comps ?? []).map((c) => ({
    id: c.id as string,
    title: c.title as string,
    phase: getCompetitionPhase(c, now),
    count: (certs ?? []).filter((x) => x.competition_id === c.id).length,
    prefix: (prefixes ?? []).find((p) => p.competition_id === c.id)?.prefix ?? null,
  }));
  const total = (certs ?? []).length;

  return (
    <>
      <PageBand
        eyebrow="Admin"
        title="Certificates"
        description="Upload certificates individually; each receives a verification code."
        aside={
          <Link href="/admin/certificates/upload" className={buttonClasses({ variant: 'primary', size: 'lg', className: 'w-full lg:w-auto' })}>
            Upload certificate
          </Link>
        }
      >
        <BandFacts
          facts={[
            { value: total, label: 'Certificates issued', color: 'text-teal' },
            { value: rows.filter((r) => r.count > 0).length, label: 'Contests with certificates' },
            { value: rows.filter((r) => r.phase === 'ended' && r.count === 0).length, label: 'Ended, none issued', color: 'text-amber' },
          ]}
        />
      </PageBand>

      <div className="shell pb-24 pt-12 sm:pt-14">
        {rows.length === 0 ? (
          <p className="rounded-2xl bg-bg-elevated px-6 py-5 text-text-tertiary">Create a competition first.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {rows.map((r) => {
              const ui = PHASE_UI[r.phase];
              return (
                <li key={r.id}>
                  <Link href={`/admin/certificates/${r.id}`} className={cn('lift flex h-full flex-col gap-3 rounded-[18px] p-5 text-text-primary sm:p-6', r.count > 0 ? 'bg-teal-bg' : 'bg-bg-surface')}>
                    <span className={cn('inline-flex items-center gap-1.5 text-sm', ui.text)}>
                      <span className={cn('h-2 w-2 rounded-full', ui.fill)} aria-hidden />
                      {ui.label}
                    </span>
                    <span className="line-clamp-2 text-lg font-bold leading-snug">{r.title}</span>
                    <span className="mt-auto flex items-baseline justify-between gap-3 text-sm">
                      <span className={r.count > 0 ? 'text-teal-soft' : r.phase === 'ended' ? 'text-amber' : 'text-text-muted'}>
                        <span className="font-mono text-lg text-text-primary">{r.count}</span> issued
                      </span>
                      {r.prefix && <span className="truncate font-mono text-text-tertiary">{r.prefix}</span>}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
