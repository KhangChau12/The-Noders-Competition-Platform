import { PageBand } from '@/components/ui/PageBand';
import VerifyForm from './VerifyForm';

export const metadata = {
  title: 'Verify a certificate – The Noders Platform',
  description: 'Check that a certificate from a The Noders PTNK contest is genuine.',
};

export default function VerifyPage() {
  return (
    <>
      <PageBand narrow eyebrow="Certificates" title="Verify a certificate" description="Enter the code printed on a certificate to view the original file and its details." />
      <section data-reveal className="shell-narrow pb-24 pt-12 sm:pb-28 sm:pt-14">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
          <div className="min-w-0 flex-1 rounded-[20px] bg-teal-bg p-6 sm:p-8">
            <VerifyForm />
          </div>
          <aside className="flex w-full flex-col gap-3 rounded-[20px] bg-bg-surface p-6 text-[15px] text-text-secondary lg:w-[340px] lg:shrink-0">
            <h2 className="h-card text-text-primary">Finding the code</h2>
            <p>The code is printed near the bottom or in a corner of the certificate.</p>
            <p className="rounded-lg bg-bg-elevated px-4 py-3 text-center font-mono tracking-[0.08em] text-teal">PREFIX-XXXX</p>
            <p className="text-sm text-text-muted">Not case-sensitive. Include the dashes.</p>
          </aside>
        </div>
      </section>
    </>
  );
}
