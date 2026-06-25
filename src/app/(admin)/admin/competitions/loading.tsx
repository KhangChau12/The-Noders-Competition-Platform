import { AdminHeaderSkeleton, StatGridSkeleton, AdminListCardSkeleton } from '@/components/admin/AdminSkeletons';

export default function AdminCompetitionsLoading() {
  return (
    <>
      <AdminHeaderSkeleton actions={1} />
      <StatGridSkeleton count={4} />
      <AdminListCardSkeleton rows={5} title="11rem" />
    </>
  );
}
