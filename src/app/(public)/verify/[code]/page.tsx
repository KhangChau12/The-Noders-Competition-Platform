import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PageBand } from '@/components/ui/PageBand';
import { buttonClasses } from '@/components/ui/Button';
import VerifyForm from '../VerifyForm';
import { vnDate } from '@/lib/ui/dates';

interface Props {
  params: { code: string };
}

export async function generateMetadata({ params }: Props) {
  return { title: `Certificate ${decodeURIComponent(params.code).toUpperCase()} – The Noders Platform`, robots: { index: false } };
}

export default async function VerifyResultPage({ params }: Props) {
  const code = decodeURIComponent(params.code).trim().toUpperCase();
  const supabase = await createClient();

  const { data: cert } = (await supabase
    .from('certificates')
    .select('recipient_name, verification_code, file_path, file_type, issued_at, competitions(id, title)')
    .eq('verification_code', code)
    .maybeSingle()) as { data: any };

  if (!cert) {
    return (
      <>
        <PageBand narrow crumbs={[{ label: 'Verify', href: '/verify' }, { label: code }]} title="Certificate not found" description="Check the code character by character; O/0 and I/1 are easily confused." />
        <section data-reveal className="shell-narrow pb-24 pt-12 sm:pb-28 sm:pt-14">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
            <div className="min-w-0 flex-1 rounded-[20px] bg-amber-bg p-6 sm:p-8">
              <p className="mb-5 text-[15px] text-amber-soft">
                You searched for <span className="break-all font-mono text-white">{code}</span>
              </p>
              <VerifyForm initial={code} />
            </div>
            <aside className="w-full rounded-[20px] bg-bg-surface p-6 text-[15px] text-text-secondary lg:w-[340px] lg:shrink-0">
              Still not found? The certificate may not have been issued through this platform. Contact the organisers at{' '}
              <a href="mailto:phuckhangtdn@gmail.com" className="link break-all">
                phuckhangtdn@gmail.com
              </a>
              .
            </aside>
          </div>
        </section>
      </>
    );
  }

  const fileUrl = supabase.storage.from('certificates').getPublicUrl(cert.file_path).data.publicUrl;
  const comp = Array.isArray(cert.competitions) ? cert.competitions[0] : cert.competitions;
  const isPdf = cert.file_type === 'pdf';
  const download = `${cert.verification_code}.${cert.file_type}`;

  return (
    <>
      <PageBand
        crumbs={[{ label: 'Verify', href: '/verify' }, { label: cert.verification_code }]}
        eyebrow={<span className="text-teal">✓ Verified</span>}
        title={cert.recipient_name}
        description="This certificate was issued by The Noders PTNK through this platform."
        aside={
          <dl className="flex flex-col gap-3 rounded-2xl bg-teal-strong p-5 text-white shadow-lift sm:p-6">
            <div>
              <dt className="text-[13px] text-teal-soft">Contest</dt>
              <dd className="text-lg font-bold leading-snug">
                {comp ? (
                  <Link href={`/competitions/${comp.id}`} className="hover:underline">
                    {comp.title}
                  </Link>
                ) : (
                  'Unknown contest'
                )}
              </dd>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <dt className="text-[13px] text-teal-soft">Issued</dt>
                <dd>{vnDate(cert.issued_at)}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-[13px] text-teal-soft">Code</dt>
                <dd className="break-all font-mono text-sm">{cert.verification_code}</dd>
              </div>
            </div>
          </dl>
        }
      />

      <section data-reveal className="shell pb-24 pt-12 sm:pb-28 sm:pt-14">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="h-section">The certificate</h2>
          <span className="flex flex-wrap gap-2.5">
            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className={buttonClasses({ variant: 'outline', size: 'sm' })}>
              Open ↗
            </a>
            <a href={fileUrl} download={download} className={buttonClasses({ variant: 'primary', size: 'sm' })}>
              Download
            </a>
          </span>
        </div>
        <div className="overflow-hidden rounded-[20px] bg-bg-surface">
          {isPdf ? (
            <iframe src={`${fileUrl}#toolbar=0&navpanes=0`} title={`Certificate for ${cert.recipient_name}`} className="h-[70vh] min-h-[420px] w-full border-0 sm:h-[720px]" />
          ) : (
            <div className="flex items-center justify-center p-3 sm:p-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={fileUrl} alt={`Certificate for ${cert.recipient_name}`} className="max-h-[720px] w-auto max-w-full rounded-lg object-contain" />
            </div>
          )}
        </div>
        {isPdf && <p className="mt-3 text-sm text-text-muted">If the preview doesn’t load on your phone, use Open or Download.</p>}
        <p className="mt-8">
          <Link href="/verify" className="link text-sm">
            Verify another certificate
          </Link>
        </p>
      </section>
    </>
  );
}
