'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function registerForCompetition(competitionId: string) {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Check if competition exists
  const { data: competition, error: compError } = (await supabase
    .from('competitions')
    .select('*')
    .eq('id', competitionId)
    .is('deleted_at', null)
    .single()) as { data: any; error: any };

  if (compError || !competition) {
    return { error: 'Competition not found' };
  }

  // Check if registration is still open
  const now = new Date();
  const registrationEnd = new Date(competition.registration_end);

  if (now > registrationEnd) {
    return { error: 'Registration period has ended' };
  }

  // Check if already registered
  const { data: existingRegistration } = (await supabase
    .from('registrations')
    .select('*')
    .eq('user_id', user.id)
    .eq('competition_id', competitionId)
    .single()) as { data: any };

  if (existingRegistration) {
    return { error: 'You are already registered for this competition' };
  }

  // Create registration
  // @ts-ignore - Supabase types need regeneration
  const { error: regError } = await supabase.from('registrations').insert({
    user_id: user.id,
    competition_id: competitionId,
    status: 'pending',
  });

  if (regError) {
    return { error: regError.message };
  }

  revalidatePath(`/competitions/${competitionId}`);
  revalidatePath('/dashboard');

  return { success: true, message: 'Registration submitted for approval' };
}
