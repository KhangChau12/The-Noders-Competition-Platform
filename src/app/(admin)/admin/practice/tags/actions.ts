'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

const db = (supabase: any) => supabase as any;

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase: null, user: null, error: 'Not authenticated' as string };
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single() as { data: { role: string } | null };
  if (profile?.role !== 'admin') return { supabase: null, user: null, error: 'Unauthorized' as string };
  return { supabase, user, error: null };
}

export async function createTag(formData: FormData) {
  const { supabase, error } = await requireAdmin();
  if (error || !supabase) return { error };

  const name = (formData.get('name') as string)?.trim();
  if (!name) return { error: 'Tag name is required' };

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const { error: insertError } = await db(supabase).from('practice_tags').insert({ name, slug });

  if (insertError) {
    if (insertError.code === '23505') return { error: 'A tag with this name already exists' };
    return { error: insertError.message };
  }

  revalidatePath('/admin/practice/tags');
  revalidatePath('/admin/practice');
  revalidatePath('/practice');
  return { success: true };
}

export async function updateTag(id: string, formData: FormData) {
  const { supabase, error } = await requireAdmin();
  if (error || !supabase) return { error };

  const name = (formData.get('name') as string)?.trim();
  if (!name) return { error: 'Tag name is required' };

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const { error: updateError } = await db(supabase)
    .from('practice_tags')
    .update({ name, slug })
    .eq('id', id);

  if (updateError) {
    if (updateError.code === '23505') return { error: 'A tag with this name already exists' };
    return { error: updateError.message };
  }

  revalidatePath('/admin/practice/tags');
  revalidatePath('/practice');
  return { success: true };
}

export async function deleteTag(id: string) {
  const { supabase, error } = await requireAdmin();
  if (error || !supabase) return { error };

  const { error: deleteError } = await db(supabase).from('practice_tags').delete().eq('id', id);

  if (deleteError) return { error: deleteError.message };

  revalidatePath('/admin/practice/tags');
  revalidatePath('/practice');
  return { success: true };
}
