import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PageBand } from '@/components/ui/PageBand';
import { buttonClasses } from '@/components/ui/Button';
import CertificatesList, { type CertRow } from './CertificatesList';

// Auth-dependent data must be fresh on every request.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = { title: 'Certificates – Admin' };

export default async function CompetitionCertificatesPage({ params }: { params: { competitionId: string } }) {
  // Auth + admin role enforced by the admin layout.
  const { competitionId } = params;
  const supabase = await createClient();

  const [{ data: competition }, { data: certificates }, { data: prefixData }] = (await Promise.all([
    supabase.from('competitions').select('id, title').eq('id', competitionId).is('deleted_at', null).maybeSingle(),
    supabase.from('certificates').select('id, verification_code, recipient_name, file_path, file_type, issued_at').eq('competition_id', competitionId).order('issued_at', { ascending: false }),
    supabase.from('certificate_prefixes').select('prefix').eq('competition_id', competitionId).maybeSingle(),
  ])) as [{ data: { id: string; title: string } | null }, { data: CertRow[] | null }, { data: { prefix: string } | null }];

  if (!competition) notFound();

  return (
    <>
      <PageBand
        crumbs={[{ label: 'Certificates', href: '/admin/certificates' }, { label: competition.title }]}
        title={competition.title}
        description={
          <>
            {certificates?.length ?? 0} certificate{certificates?.length === 1 ? '' : 's'}
            {prefixData?.prefix && (
              <>
                {' '}
                · prefix <span className="font-mono text-white">{prefixData.prefix}</span>
              </>
            )}
          </>
        }
        aside={
          <Link href={`/admin/certificates/upload?competition=${competitionId}`} className={buttonClasses({ variant: 'primary', size: 'lg', className: 'w-full lg:w-auto' })}>
            Upload certificate
          </Link>
        }
      />
      <div className="shell pb-24 pt-12 sm:pt-14">
        <CertificatesList certificates={certificates ?? []} />
      </div>
    </>
  );
}
