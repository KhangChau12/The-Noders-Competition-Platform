import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import EditCompetitionForm from './EditCompetitionForm';

export default async function EditCompetitionPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();

  // Check authentication and admin role
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = (await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()) as { data: { role: string } | null };

  if (profile?.role !== 'admin') {
    redirect('/dashboard');
  }

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
