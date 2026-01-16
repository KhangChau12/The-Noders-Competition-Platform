'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateCompetition(id: string, formData: FormData) {
  const supabase = await createClient();

  // Check authentication and admin role
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  const { data: profile } = (await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()) as { data: { role: string } | null };

  if (profile?.role !== 'admin') {
    return { error: 'Unauthorized - Admin access required' };
  }

  // Extract form data
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const problemStatement = formData.get('problemStatement') as string;
  const participationType = formData.get('participationType') as string;
  const scoringMetric = formData.get('scoringMetric') as string;

  const registrationStart = formData.get('registrationStart') as string;
  const registrationEnd = formData.get('registrationEnd') as string;
  const publicTestStart = formData.get('publicTestStart') as string;
  const publicTestEnd = formData.get('publicTestEnd') as string;
  const privateTestStart = formData.get('privateTestStart') as string;
  const privateTestEnd = formData.get('privateTestEnd') as string;

  const datasetUrl = formData.get('datasetUrl') as string;
  const sampleSubmissionUrl = formData.get('sampleSubmissionUrl') as string;
  const dailySubmissionLimitRaw = formData.get('dailySubmissionLimit') as string;
  const totalSubmissionLimitRaw = formData.get('totalSubmissionLimit') as string;
  const dailySubmissionLimit = dailySubmissionLimitRaw ? parseInt(dailySubmissionLimitRaw) : 15;
  const totalSubmissionLimit = totalSubmissionLimitRaw ? parseInt(totalSubmissionLimitRaw) : 10000;
  const maxFileSizeMb = parseInt(formData.get('maxFileSizeMb') as string);

  // Validate required fields
  if (
    !title ||
    !description ||
    !participationType ||
    !registrationStart ||
    !registrationEnd ||
    !publicTestStart ||
    !publicTestEnd
  ) {
    return { error: 'Please fill in all required fields' };
  }

  // Validate scoring metric
  const validMetrics = ['f1_score', 'accuracy', 'precision', 'recall', 'mae', 'rmse'];
  if (scoringMetric && !validMetrics.includes(scoringMetric)) {
    return { error: 'Invalid scoring metric. Must be one of: f1_score, accuracy, precision, recall, mae, rmse' };
  }

  // Update competition
  const { error } = await supabase
    .from('competitions')
    // @ts-expect-error - Supabase types need regeneration
    .update({
      title,
      description,
      problem_statement: problemStatement || description,
      participation_type: participationType,
      scoring_metric: scoringMetric || 'f1_score',
      registration_start: new Date(registrationStart).toISOString(),
      registration_end: new Date(registrationEnd).toISOString(),
      public_test_start: new Date(publicTestStart).toISOString(),
      public_test_end: new Date(publicTestEnd).toISOString(),
      private_test_start: privateTestStart
        ? new Date(privateTestStart).toISOString()
        : null,
      private_test_end: privateTestEnd
        ? new Date(privateTestEnd).toISOString()
        : null,
      dataset_url: datasetUrl || null,
      sample_submission_url: sampleSubmissionUrl || null,
      daily_submission_limit: dailySubmissionLimit,
      total_submission_limit: totalSubmissionLimit,
      max_file_size_mb: maxFileSizeMb || 10,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating competition:', error);
    return { error: error.message || 'Failed to update competition' };
  }

  revalidatePath('/admin/competitions');
  revalidatePath(`/competitions/${id}`);
  return { success: true };
}
