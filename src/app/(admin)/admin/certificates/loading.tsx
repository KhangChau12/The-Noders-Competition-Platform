import { AdminHeaderSkeleton, CertificatesByCompetitionSkeleton } from '@/components/admin/AdminSkeletons';

export default function AdminCertificatesLoading() {
  return (
    <>
      <AdminHeaderSkeleton actions={1} />
      <CertificatesByCompetitionSkeleton rows={5} />
    </>
  );
}
