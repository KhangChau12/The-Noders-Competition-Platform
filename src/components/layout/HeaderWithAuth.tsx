import { createClient } from '@/lib/supabase/server';
import Header from './Header';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

async function logout() {
  'use server';
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function HeaderWithAuth() {
  // Force fresh data on every request
  const cookieStore = await cookies();
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  let user = null;

  if (authUser) {
    // Fetch full user profile
    const { data: profile, error } = await supabase
      .from('users')
      .select('id, email, full_name, avatar_url, role')
      .eq('id', authUser.id)
      .single();

    if (profile) {
      user = {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name || undefined,
        avatar_url: profile.avatar_url || undefined,
        role: profile.role as 'user' | 'admin',
      };
    } else if (error) {
      // Fallback: Profile doesn't exist in DB yet, create user object from auth data
      // This can happen if the user was created before the trigger was set up
      console.error('User profile not found in database:', error);

      // Try to insert the user into the database
      const { error: insertError } = await supabase.from('users').insert({
        id: authUser.id,
        email: authUser.email!,
        role: 'user',
        full_name: authUser.user_metadata?.full_name || null,
        avatar_url: authUser.user_metadata?.avatar_url || null,
      });

      if (!insertError) {
        // Successfully created, now fetch again
        const { data: newProfile } = await supabase
          .from('users')
          .select('id, email, full_name, avatar_url, role')
          .eq('id', authUser.id)
          .single();

        if (newProfile) {
          user = {
            id: newProfile.id,
            email: newProfile.email,
            full_name: newProfile.full_name || undefined,
            avatar_url: newProfile.avatar_url || undefined,
            role: newProfile.role as 'user' | 'admin',
          };
        }
      } else {
        // If insert also failed, use auth data as fallback
        console.error('Failed to create user profile:', insertError);
        user = {
          id: authUser.id,
          email: authUser.email!,
          full_name: authUser.user_metadata?.full_name || undefined,
          avatar_url: authUser.user_metadata?.avatar_url || undefined,
          role: 'user' as 'user' | 'admin',
        };
      }
    }
  }

  return <Header user={user} />;
}
