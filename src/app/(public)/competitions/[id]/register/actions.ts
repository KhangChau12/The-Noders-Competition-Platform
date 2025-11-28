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

  // Allow late registration - no time restriction

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
