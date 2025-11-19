'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function approveRegistration(registrationId: string) {
  const supabase = await createClient();

  // Check if user is admin
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Check admin role
  const { data: profile } = (await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()) as { data: { role: string } | null };

  if (profile?.role !== 'admin') {
    return { error: 'Unauthorized - Admin access required' };
  }

  // Update registration status
  // @ts-ignore - Supabase types need regeneration
  const { error } = await supabase.from('registrations').update({
    status: 'approved',
    updated_at: new Date().toISOString(),
  }).eq('id', registrationId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/dashboard');
  return { success: true };
}

export async function rejectRegistration(registrationId: string) {
  const supabase = await createClient();

  // Check if user is admin
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Check admin role
  const { data: profile } = (await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()) as { data: { role: string } | null };

  if (profile?.role !== 'admin') {
    return { error: 'Unauthorized - Admin access required' };
  }

  // Update registration status
  // @ts-ignore - Supabase types need regeneration
  const { error } = await supabase.from('registrations').update({
    status: 'rejected',
    updated_at: new Date().toISOString(),
  }).eq('id', registrationId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/dashboard');
  return { success: true };
}
