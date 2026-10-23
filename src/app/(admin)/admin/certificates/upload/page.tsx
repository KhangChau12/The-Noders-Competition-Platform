import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PageBand } from '@/components/ui/PageBand';
import UploadCertificateForm from './UploadCertificateForm';

// Auth-dependent data must be fresh on every request.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = { title: 'Upload certificate – Admin' };

export default async function UploadCertificatePage({ searchParams }: { searchParams: { competition?: string } }) {
  const supabase = await createClient();
  // Admin role enforced by the admin layout. We still need the user id for the upload.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: competitions }, { data: prefixes }] = (await Promise.all([
    supabase.from('competitions').select('id, title').is('deleted_at', null).order('created_at', { ascending: false }),
    supabase.from('certificate_prefixes').select('competition_id, prefix'),
  ])) as [{ data: { id: string; title: string }[] | null }, { data: { competition_id: string; prefix: string }[] | null }];

  const prefixMap: Record<string, string> = {};
  (prefixes ?? []).forEach((p) => (prefixMap[p.competition_id] = p.prefix));

  return (
    <>
      <PageBand narrow crumbs={[{ label: 'Certificates', href: '/admin/certificates' }, { label: 'Upload' }]} title="Upload a certificate" description="Each certificate receives a code that can be checked at /verify." />
      <div className="shell-narrow pb-24 pt-10 sm:pt-12">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
          <div className="min-w-0 flex-1">
            <UploadCertificateForm competitions={competitions ?? []} prefixMap={prefixMap} selectedCompetitionId={searchParams.competition ?? null} userId={user.id} />
          </div>
          <aside className="flex w-full flex-col gap-2.5 rounded-[18px] bg-violet-bg p-6 text-[15px] text-text-secondary lg:w-[300px] lg:shrink-0">
            <span className="text-[13px] font-semibold text-violet">Before you upload</span>
            <p>Print the code on the design before uploading so the file matches the record.</p>
            <p>Generate a suffix, add the full code to the design, export, then upload.</p>
          </aside>
        </div>
      </div>
    </>
  );
}
