import { createClient } from '@/lib/supabase/server';
import { PageBand } from '@/components/ui/PageBand';
import PracticeEditor, { EMPTY_PRACTICE } from '@/components/admin/PracticeEditor';
import { createPracticeProblem } from './actions';

export const metadata = { title: 'New practice problem – Admin' };

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CreatePracticeProblemPage() {
  // Auth + admin role enforced by the admin layout.
  const supabase = await createClient();
  const { data: tags } = (await supabase.from('practice_tags').select('id, name, slug').order('name')) as { data: { id: string; name: string; slug: string }[] | null };

  return (
    <>
      <PageBand crumbs={[{ label: 'Practice', href: '/admin/practice' }, { label: 'New' }]} title="New practice problem" description="Practice problems never close. Have the answer key CSV ready." />
      <div className="shell pb-24 pt-10 sm:pt-12">
        <PracticeEditor mode="create" initial={EMPTY_PRACTICE} tags={tags ?? []} initialTagIds={[]} save={createPracticeProblem} />
      </div>
    </>
  );
}
