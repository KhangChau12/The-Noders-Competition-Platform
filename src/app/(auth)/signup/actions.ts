'use server';

import { createClient } from '@/lib/supabase/server';

export async function signUp(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('fullName') as string;

  if (!email || !password || !fullName) {
    return { error: 'All fields are required' };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    // Map Supabase errors to user-friendly messages
    const errorMessages: Record<string, string> = {
      'User already registered': 'An account with this email already exists',
      'Password should be at least 8 characters': 'Password must be at least 6 characters long',
      'Password should be at least 6 characters': 'Password must be at least 6 characters long',
    };

    return { error: errorMessages[error.message] || error.message };
  }

  return {
    success: true,
    message: 'Check your email to verify your account',
    email,
  };
}
