import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import CreateTeamForm from './CreateTeamForm';

export default async function CreateTeamPage() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  return <CreateTeamForm />;
}
