import { createClient } from '@/lib/supabase/server';
import CreatePracticeProblemForm from './CreatePracticeProblemForm';

export const metadata = { title: 'Create Practice Problem' };

export default async function CreatePracticeProblemPage() {
  const supabase = await createClient();

  // Auth + admin role enforced by the admin layout.
  const { data: tags } = await supabase.from('practice_tags').select('*').order('name');

  return (
    <div className="max-w-4xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="font-brand text-2xl sm:text-3xl lg:text-4xl mb-1.5 gradient-text leading-tight">
            Create Practice Problem
          </h1>
          <p className="text-sm sm:text-base text-text-secondary">Set up a permanent practice problem for participants</p>
        </div>

        <CreatePracticeProblemForm tags={tags ?? []} />
    </div>
  );
}
