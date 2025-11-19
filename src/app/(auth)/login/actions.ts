'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const redirectTo = formData.get('redirect') as string | null;

  if (!email || !password) {
    return { error: 'Email and password are required' };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Map Supabase errors to user-friendly messages
    const errorMessages: Record<string, string> = {
      'Invalid login credentials': 'Invalid email or password',
      'Email not confirmed': 'Please verify your email before logging in',
    };

    return { error: errorMessages[error.message] || error.message };
  }

  // Fetch user role to determine redirect
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', data.user.id)
    .single();

  // If redirect parameter exists and is safe, use it
  if (redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//')) {
    redirect(redirectTo);
  }

  // Otherwise, redirect based on role
  if (user?.role === 'admin') {
    redirect('/admin/dashboard');
  } else {
    redirect('/dashboard');
  }
}
