'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { CONTEST_TAG } from '@/lib/data/competitions';

async function reviewRegistration(registrationId: string, status: 'approved' | 'rejected') {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: profile } = (await supabase.from('users').select('role').eq('id', user.id).maybeSingle()) as { data: { role: string } | null };
  if (profile?.role !== 'admin') return { error: 'Unauthorized - Admin access required' };

  // registrations has reviewed_at / reviewed_by (no updated_at column).
  const { data: reg, error } = (await (supabase as any)
    .from('registrations')
    .update({ status, reviewed_at: new Date().toISOString(), reviewed_by: user.id })
    .eq('id', registrationId)
    .select('competition_id')
    .maybeSingle()) as { data: { competition_id: string } | null; error: { message: string } | null };

  if (error) return { error: error.message };

  revalidateTag(CONTEST_TAG);
  revalidatePath('/admin/dashboard');
  revalidatePath('/dashboard');
  if (reg?.competition_id) revalidatePath(`/competitions/${reg.competition_id}`);
  return { success: true };
}

export async function approveRegistration(registrationId: string) {
  return reviewRegistration(registrationId, 'approved');
}

export async function rejectRegistration(registrationId: string) {
  return reviewRegistration(registrationId, 'rejected');
}
