import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import CreatePracticeProblemForm from './CreatePracticeProblemForm';

export const metadata = { title: 'Create Practice Problem' };

export default async function CreatePracticeProblemPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single() as { data: { role: string } | null };
  if (profile?.role !== 'admin') redirect('/dashboard');

  const { data: tags } = await supabase.from('practice_tags').select('*').order('name');

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="font-brand text-4xl sm:text-5xl mb-2 gradient-text">
            Create Practice Problem
          </h1>
          <p className="text-text-secondary">Set up a permanent practice problem for participants</p>
        </div>

        <CreatePracticeProblemForm tags={tags ?? []} />
      </div>
    </div>
  );
}
