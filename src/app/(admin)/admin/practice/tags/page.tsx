import { createClient } from '@/lib/supabase/server';
import { PageBand } from '@/components/ui/PageBand';
import TagManager from './TagManager';

export const metadata = { title: 'Practice tags – Admin' };

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PracticeTagsPage() {
  // Auth + admin role enforced by the admin layout.
  const supabase = await createClient();
  const [{ data: tags }, { data: uses }] = (await Promise.all([
    supabase.from('practice_tags').select('id, name, slug').order('name'),
    supabase.from('practice_problem_tags').select('tag_id'),
  ])) as [{ data: { id: string; name: string; slug: string }[] | null }, { data: { tag_id: string }[] | null }];

  const list = (tags ?? []).map((t) => ({ ...t, uses: (uses ?? []).filter((u) => u.tag_id === t.id).length }));

  return (
    <>
      <PageBand
        narrow
        crumbs={[{ label: 'Practice', href: '/admin/practice' }, { label: 'Tags' }]}
        title="Tags"
        description="Tags group problems. Names containing NLP, CV/vision or tabular also set the domain colour."
      />
      <div className="shell-narrow pb-24 pt-10 sm:pt-12">
        <div className="max-w-[760px]">
          <TagManager tags={list} />
        </div>
      </div>
    </>
  );
}
