'use server';

import { createClient } from '@/lib/supabase/server';

export async function getCompetitionRegistrations(competitionId: string) {
  const supabase = await createClient();

  const { data: registrations, error } = await supabase
    .from('registrations')
    .select(`
      id,
      status,
      registered_at,
      user:users!registrations_user_id_fkey (
        id,
        full_name,
        email
      )
    `)
    .eq('competition_id', competitionId)
    .order('registered_at', { ascending: false });

  if (error) {
    console.error('Error fetching registrations:', error);
    return { registrations: [], error: error.message };
  }

  return { registrations: registrations || [], error: null };
}
