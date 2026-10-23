import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PageBand } from '@/components/ui/PageBand';
import CompetitionEditor, { type CompetitionDraft } from '@/components/admin/CompetitionEditor';
import AnswerKeys, { type KeyInfo } from './AnswerKeys';
import DeleteCompetitionButton from '../../DeleteCompetitionButton';
import { updateCompetition } from './actions';

// Auth-dependent data must be fresh on every request.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = { title: 'Edit competition – Admin' };

export default async function EditCompetitionPage({ params }: { params: { id: string } }) {
  // Auth + admin role enforced by the admin layout.
  const supabase = await createClient();

  const [{ data: c }, { data: keys }] = (await Promise.all([
    supabase
      .from('competitions')
      .select(
        'id, title, description, problem_statement, competition_type, participation_type, scoring_metric, registration_start, registration_end, public_test_end, private_test_end, dataset_url, sample_submission_url, daily_submission_limit, total_submission_limit, max_file_size_mb, min_team_size, max_team_size'
      )
      .eq('id', params.id)
      .is('deleted_at', null)
      .maybeSingle(),
    supabase.from('test_datasets').select('phase, file_name, uploaded_at').eq('competition_id', params.id),
  ])) as [{ data: CompetitionDraft & { id: string } | null }, { data: { phase: 'public' | 'private'; file_name: string; uploaded_at: string }[] | null }];

  if (!c) notFound();

  const keyInfo: KeyInfo[] = (keys ?? []).map((k) => ({ phase: k.phase, fileName: k.file_name, uploadedAt: k.uploaded_at }));

  return (
    <>
      <PageBand crumbs={[{ label: 'Competitions', href: '/admin/competitions' }, { label: 'Edit' }]} title={c.title} description="Changes show on the site as soon as you save." />
      <div className="shell pb-24 pt-10 sm:pt-12">
        <CompetitionEditor
          mode="edit"
          initial={c}
          save={updateCompetition.bind(null, c.id)}
          below={
            <>
              <AnswerKeys competitionId={c.id} fourPhase={c.competition_type === '4-phase'} keys={keyInfo} />
              <section className="flex flex-col gap-3 rounded-[18px] border border-error/30 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
                <span>
                  <span className="block text-lg font-bold">Delete competition</span>
                  <span className="text-[15px] text-text-tertiary">Hides it everywhere. Data stays in the database.</span>
                </span>
                <DeleteCompetitionButton competitionId={c.id} competitionTitle={c.title} after="/admin/competitions" />
              </section>
            </>
          }
        />
      </div>
    </>
  );
}
