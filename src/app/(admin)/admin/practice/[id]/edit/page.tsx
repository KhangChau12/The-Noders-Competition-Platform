import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import EditPracticeProblemForm from './EditPracticeProblemForm';

export const metadata = { title: 'Edit Practice Problem' };

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditPracticeProblemPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const db = supabase as any;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single() as { data: { role: string } | null };
  if (profile?.role !== 'admin') redirect('/dashboard');

  const { data: problem } = await db
    .from('practice_problems')
    .select('*')
    .eq('id', id)
    .single();

  if (!problem) notFound();

  const { data: problemTags } = await db
    .from('practice_problem_tags')
    .select('tag_id')
    .eq('problem_id', id);

  const { data: allTags } = await db.from('practice_tags').select('*').order('name');

  const currentTagIds = (problemTags ?? []).map((pt: any) => pt.tag_id);

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="font-brand text-4xl sm:text-5xl mb-2 gradient-text">
            Edit Practice Problem
          </h1>
          <p className="text-text-secondary line-clamp-1">{problem.title}</p>
        </div>

        <EditPracticeProblemForm
          problem={problem}
          allTags={allTags ?? []}
          currentTagIds={currentTagIds}
        />
      </div>
    </div>
  );
}
