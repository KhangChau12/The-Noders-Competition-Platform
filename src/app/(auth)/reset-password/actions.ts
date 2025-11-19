'use server';

import { createClient } from '@/lib/supabase/server';

export async function resetPassword(formData: FormData) {
  const email = formData.get('email') as string;

  if (!email) {
    return { error: 'Email is required' };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  // Always return success (security best practice - don't reveal if email exists)
  return {
    success: true,
    message: 'Check your email for password reset instructions',
  };
}

export async function updatePassword(formData: FormData) {
  const password = formData.get('password') as string;

  if (!password) {
    return { error: 'Password is required' };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return { error: error.message };
  }

  return {
    success: true,
    message: 'Password updated successfully',
  };
}
