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

  const registrationStart = formData.get('registrationStart') as string;
  const registrationEnd = formData.get('registrationEnd') as string;
  const publicTestStart = formData.get('publicTestStart') as string;
  const publicTestEnd = formData.get('publicTestEnd') as string;
  const privateTestStart = formData.get('privateTestStart') as string;
  const privateTestEnd = formData.get('privateTestEnd') as string;

  const datasetUrl = formData.get('datasetUrl') as string;
  const sampleSubmissionUrl = formData.get('sampleSubmissionUrl') as string;
  const dailySubmissionLimit = parseInt(formData.get('dailySubmissionLimit') as string);
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

  // Update competition
  const { error } = await supabase
    .from('competitions')
    // @ts-expect-error - Supabase types need regeneration
    .update({
      title,
      description,
      problem_statement: problemStatement || description,
      participation_type: participationType,
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
      daily_submission_limit: dailySubmissionLimit || 5,
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
