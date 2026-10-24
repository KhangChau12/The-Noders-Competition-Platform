'use server';

import { z } from 'zod';
import { revalidatePath, revalidateTag } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { CONTEST_TAG } from '@/lib/data/competitions';
import { PRACTICE_TAG } from '@/lib/data/practice';

const ProfileSchema = z.object({
  full_name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80, 'Name must not exceed 80 characters'),
  bio: z.string().trim().max(200, 'Bio must not exceed 200 characters'),
});

/** Update the signed-in user's display name and bio. */
export async function updateProfile(input: { full_name: string; bio: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const parsed = ProfileSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };

  const { error } = await (supabase as any)
    .from('users')
    .update({ full_name: parsed.data.full_name, bio: parsed.data.bio || null })
    .eq('id', user.id);
  if (error) return { error: error.message };

  revalidateTag(CONTEST_TAG);
  revalidateTag(PRACTICE_TAG);
  revalidatePath('/profile');
  revalidatePath('/dashboard');
  revalidatePath('/', 'layout');
  return { success: true as const, message: 'Profile saved' };
}
