import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import EditCompetitionForm from './EditCompetitionForm';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function EditCompetitionPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  // Auth + admin role enforced by the admin layout.

  // Fetch competition data
  const { data: competition } = (await supabase
    .from('competitions')
    .select('*')
    .eq('id', params.id)
    .is('deleted_at', null)
    .single()) as { data: any };

  if (!competition) {
    redirect('/admin/competitions');
  }

  return <EditCompetitionForm competition={competition} />;
}
