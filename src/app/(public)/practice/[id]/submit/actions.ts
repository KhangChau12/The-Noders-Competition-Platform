'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

const db = (client: any) => client as any;

export async function submitPracticeSolution(problemId: string, formData: FormData) {
  const supabase = await createClient();

  // Require authentication (no registration check — anyone can practice)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // Get practice problem details
  const { data: problem, error: probError } = await db(supabase)
    .from('practice_problems')
    .select('*')
    .eq('id', problemId)
    .is('deleted_at', null)
    .single();

  if (probError || !problem) return { error: 'Practice problem not found' };

  // Check daily submission limit
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { count: dailyCount } = await db(supabase)
    .from('practice_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('problem_id', problemId)
    .eq('user_id', user.id)
    .eq('validation_status', 'valid')
    .gte('submitted_at', todayStart.toISOString());

  if ((dailyCount ?? 0) >= problem.daily_submission_limit) {
    return { error: `Daily submission limit of ${problem.daily_submission_limit} reached` };
  }

  // Check total submission limit (0 = unlimited)
  if (problem.total_submission_limit > 0) {
    const { count: totalCount } = await db(supabase)
      .from('practice_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('problem_id', problemId)
      .eq('user_id', user.id)
      .eq('validation_status', 'valid');

    if ((totalCount ?? 0) >= problem.total_submission_limit) {
      return { error: `Total submission limit of ${problem.total_submission_limit} reached` };
    }
  }

  // Validate file
  const file = formData.get('file') as File;
  if (!file) return { error: 'No file provided' };
  if (!file.name.endsWith('.csv')) return { error: 'Only CSV files are allowed' };

  const maxSize = problem.max_file_size_mb * 1024 * 1024;
  if (file.size > maxSize) return { error: `File size exceeds ${problem.max_file_size_mb}MB limit` };

  const fileContent = await file.text();
  const lines = fileContent.split('\n').filter((l: string) => l.trim());
  if (lines.length < 2) return { error: 'CSV must contain at least a header and one data row' };

  // Upload file to submissions bucket
  const fileName = `${user.id}/practice/${problemId}/${Date.now()}_${file.name}`;
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('submissions')
    .upload(fileName, file, { contentType: 'text/csv', upsert: false });

  if (uploadError) return { error: `Upload failed: ${uploadError.message}` };

  // Insert practice_submission row using admin client (bypasses RLS)
  const adminClient = createAdminClient();
  const { data: submission, error: subError } = await db(adminClient)
    .from('practice_submissions')
    .insert({
      problem_id: problemId,
      user_id: user.id,
      file_path: uploadData.path,
      file_name: file.name,
      file_size_bytes: file.size,
      validation_status: 'pending',
      is_best_score: false,
    })
    .select()
    .single();

  if (subError || !submission) {
    await supabase.storage.from('submissions').remove([uploadData.path]);
    return { error: `Submission failed: ${subError?.message ?? 'Unknown error'}` };
  }

  // Invoke validate-csv Edge Function with submissionType: 'practice'
  try {
    await supabase.functions.invoke('validate-csv', {
      body: { submissionId: submission.id, submissionType: 'practice' },
    });
  } catch (err) {
    console.error('Failed to invoke validation function:', err);
  }

  revalidatePath(`/practice/${problemId}`);
  revalidatePath(`/practice/${problemId}/submit`);

  return {
    success: true,
    message: 'Submission uploaded! Your score will appear shortly.',
    submissionId: submission.id,
  };
}
