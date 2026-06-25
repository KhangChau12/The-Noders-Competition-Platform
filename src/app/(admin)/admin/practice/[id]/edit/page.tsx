import { notFound } from 'next/navigation';
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

  // Auth + admin role enforced by the admin layout.
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
    <div className="max-w-4xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <h1 className="font-brand text-2xl sm:text-3xl lg:text-4xl mb-1.5 gradient-text leading-tight">
            Edit Practice Problem
          </h1>
          <p className="text-sm sm:text-base text-text-secondary line-clamp-1">{problem.title}</p>
        </div>

        <EditPracticeProblemForm
          problem={problem}
          allTags={allTags ?? []}
          currentTagIds={currentTagIds}
        />
    </div>
  );
}
