'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function deleteCompetition(competitionId: string) {
  const supabase = await createClient();

  // Check authentication and admin role
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Check admin role
  const { data: profile, error: profileError } = (await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()) as { data: { role: string } | null; error: any };

  if (profileError) {
    return { error: `Profile fetch error: ${profileError.message}` };
  }

  if (profile?.role !== 'admin') {
    return { error: 'Unauthorized - Admin access required' };
  }

  // Check if competition exists
  const { data: competition, error: fetchError } = await supabase
    .from('competitions')
    .select('id, title')
    .eq('id', competitionId)
    .is('deleted_at', null)
    .single();

  if (fetchError || !competition) {
    return { error: 'Competition not found' };
  }

  // Use admin client to bypass RLS for soft delete
  const adminClient = createAdminClient();
  const { error: deleteError } = await (adminClient as any)
    .from('competitions')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', competitionId);

  if (deleteError) {
    return { error: `Failed to delete competition: ${deleteError.message}` };
  }

  // Revalidate paths
  revalidatePath('/admin/competitions');
  revalidatePath('/competitions');
  revalidatePath('/dashboard');

  return { success: true, message: 'Competition deleted successfully' };
}
