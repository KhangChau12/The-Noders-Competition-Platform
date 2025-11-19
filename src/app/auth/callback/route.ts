import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/dashboard';

  if (code) {
    const supabase = await createClient();

    try {
      // Exchange code for session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('Error exchanging code for session:', error);
        // Redirect to login with error message
        return NextResponse.redirect(
          new URL(
            `/login?error=${encodeURIComponent('Email verification failed. Please try again.')}`,
            requestUrl.origin
          )
        );
      }

      if (data.session) {
        // Get user role to determine redirect
        const { data: userProfile } = (await supabase
          .from('users')
          .select('role')
          .eq('id', data.session.user.id)
          .single()) as { data: { role: string } | null };

        // Redirect based on role
        if (userProfile?.role === 'admin') {
          return NextResponse.redirect(new URL('/admin/dashboard', requestUrl.origin));
        }

        // Redirect to next URL or dashboard
        return NextResponse.redirect(new URL(next, requestUrl.origin));
      }
    } catch (err) {
      console.error('Unexpected error during email verification:', err);
      return NextResponse.redirect(
        new URL(
          `/login?error=${encodeURIComponent('An unexpected error occurred.')}`,
          requestUrl.origin
        )
      );
    }
  }

  // No code provided, redirect to login
  return NextResponse.redirect(
    new URL(
      `/login?error=${encodeURIComponent('Invalid verification link.')}`,
      requestUrl.origin
    )
  );
}
