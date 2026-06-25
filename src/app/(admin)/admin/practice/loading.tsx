import { AdminHeaderSkeleton, StatGridSkeleton, AdminListCardSkeleton } from '@/components/admin/AdminSkeletons';

export default function AdminPracticeLoading() {
  return (
    <>
      <AdminHeaderSkeleton actions={2} />
      <StatGridSkeleton count={3} />
      <AdminListCardSkeleton rows={5} title="13rem" />
    </>
  );
}
