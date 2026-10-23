import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PageBand } from '@/components/ui/PageBand';
import CreateTeamCard from '@/components/teams/CreateTeamCard';

export const metadata = { title: 'Create a team – The Noders Platform' };

export default async function CreateTeamPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/teams/create');

  return (
    <>
      <PageBand narrow crumbs={[{ label: 'Teams', href: '/teams' }, { label: 'Create' }]} title="Create a team" description="You will be the team leader and can invite members afterwards." />
      <section data-reveal className="shell-narrow pb-24 pt-12 sm:pt-14">
        <CreateTeamCard autoFocus className="max-w-[560px]" />
      </section>
    </>
  );
}
