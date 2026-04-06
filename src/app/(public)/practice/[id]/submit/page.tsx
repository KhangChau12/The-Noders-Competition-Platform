import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ChevronLeft } from 'lucide-react';
import PracticeSubmitForm from './PracticeSubmitForm';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PracticeSubmitPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  // Must be authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/practice/${id}/submit`);

  // Get problem
  const { data: problem } = await (supabase as any)
    .from('practice_problems')
    .select('id, title, daily_submission_limit, total_submission_limit, max_file_size_mb')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (!problem) notFound();

  // Count today's valid submissions
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { count: dailyUsed } = await (supabase as any)
    .from('practice_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('problem_id', id)
    .eq('user_id', user.id)
    .eq('validation_status', 'valid')
    .gte('submitted_at', todayStart.toISOString());

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Back link */}
        <div className="mb-6">
          <Link href={`/practice/${id}`}>
            <Button variant="outline" size="sm">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back to Problem
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="font-brand text-3xl sm:text-4xl gradient-text mb-2">Submit Solution</h1>
          <p className="text-text-secondary line-clamp-1">{problem.title}</p>
        </div>

        <PracticeSubmitForm
          problemId={id}
          maxFileSizeMb={problem.max_file_size_mb}
          dailySubmissionLimit={problem.daily_submission_limit}
          dailyUsed={dailyUsed ?? 0}
        />
      </div>
    </div>
  );
}
