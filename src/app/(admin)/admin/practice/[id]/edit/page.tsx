import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PageBand } from '@/components/ui/PageBand';
import PracticeEditor, { type PracticeDraft } from '@/components/admin/PracticeEditor';
import DeletePracticeProblemButton from '../../DeletePracticeProblemButton';
import { updatePracticeProblem } from './actions';

// Auth-dependent data must be fresh on every request.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = { title: 'Edit practice problem – Admin' };

export default async function EditPracticeProblemPage({ params }: { params: { id: string } }) {
  // Auth + admin role enforced by the admin layout.
  const { id } = params;
  const supabase = await createClient();

  const [{ data: problem }, { data: problemTags }, { data: allTags }, { data: key }] = (await Promise.all([
    supabase
      .from('practice_problems')
      .select('id, title, description, problem_statement, scoring_metric, difficulty, dataset_url, sample_submission_url, daily_submission_limit, total_submission_limit, max_file_size_mb')
      .eq('id', id)
      .is('deleted_at', null)
      .maybeSingle(),
    supabase.from('practice_problem_tags').select('tag_id').eq('problem_id', id),
    supabase.from('practice_tags').select('id, name, slug').order('name'),
    supabase.from('practice_test_datasets').select('file_name').eq('problem_id', id).maybeSingle(),
  ])) as [{ data: (PracticeDraft & { id: string }) | null }, { data: { tag_id: string }[] | null }, { data: { id: string; name: string; slug: string }[] | null }, { data: { file_name: string } | null }];

  if (!problem) notFound();

  return (
    <>
      <PageBand crumbs={[{ label: 'Practice', href: '/admin/practice' }, { label: 'Edit' }]} title={problem.title} description="Changes show on the site as soon as you save." />
      <div className="shell pb-24 pt-10 sm:pt-12">
        <PracticeEditor
          mode="edit"
          initial={problem}
          tags={allTags ?? []}
          initialTagIds={(problemTags ?? []).map((t) => t.tag_id)}
          currentKey={key?.file_name ?? null}
          save={updatePracticeProblem.bind(null, problem.id)}
          below={
            <section className="flex flex-col gap-3 rounded-[18px] border border-error/30 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
              <span>
                <span className="block text-lg font-bold">Delete problem</span>
                <span className="text-[15px] text-text-tertiary">Hides it from the practice list. Submissions stay in the database.</span>
              </span>
              <DeletePracticeProblemButton problemId={problem.id} problemTitle={problem.title} after="/admin/practice" />
            </section>
          }
        />
      </div>
    </>
  );
}
