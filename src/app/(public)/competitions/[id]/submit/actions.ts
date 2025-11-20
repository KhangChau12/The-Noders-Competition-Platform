'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function submitSolution(competitionId: string, formData: FormData) {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Get competition details
  const { data: competition, error: compError } = (await supabase
    .from('competitions')
    .select('*')
    .eq('id', competitionId)
    .is('deleted_at', null)
    .single()) as { data: any; error: any };

  if (compError || !competition) {
    return { error: 'Competition not found' };
  }

  // Check registration status
  const { data: registration } = (await supabase
    .from('registrations')
    .select('*')
    .eq('user_id', user.id)
    .eq('competition_id', competitionId)
    .single()) as { data: any };

  if (!registration || registration.status !== 'approved') {
    return { error: 'You are not approved for this competition' };
  }

  // Check if competition is in valid phase for submissions
  const now = new Date();
  const publicTestEnd = new Date(competition.public_test_end);
  const privateTestEnd = competition.private_test_end
    ? new Date(competition.private_test_end)
    : null;
  const registrationEnd = new Date(competition.registration_end);

  let currentPhase = 'ended';
  if (now >= registrationEnd && now < publicTestEnd) {
    currentPhase = 'public_test';
  } else if (privateTestEnd && now >= publicTestEnd && now < privateTestEnd) {
    currentPhase = 'private_test';
  }

  if (currentPhase !== 'public_test' && currentPhase !== 'private_test') {
    return { error: 'Submissions are not allowed in the current competition phase' };
  }

  // Check daily submission limit
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { count: dailyCount } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('competition_id', competitionId)
    .gte('submitted_at', todayStart.toISOString());

  if ((dailyCount || 0) >= (competition.daily_submission_limit || 5)) {
    return { error: 'Daily submission limit reached' };
  }

  // Get the file
  const file = formData.get('file') as File;
  if (!file) {
    return { error: 'No file provided' };
  }

  // Validate file type
  if (!file.name.endsWith('.csv')) {
    return { error: 'Only CSV files are allowed' };
  }

  // Validate file size
  const maxSize = (competition.max_file_size_mb || 10) * 1024 * 1024;
  if (file.size > maxSize) {
    return { error: `File size exceeds ${competition.max_file_size_mb || 10}MB limit` };
  }

  // Read file content for basic validation
  const fileContent = await file.text();
  const lines = fileContent.split('\n').filter((line) => line.trim());

  if (lines.length < 2) {
    return { error: 'CSV file must contain at least a header and one data row' };
  }

  // Upload file to Supabase Storage
  const fileName = `${user.id}/${competitionId}/${Date.now()}_${file.name}`;
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('submissions')
    .upload(fileName, file, {
      contentType: 'text/csv',
      upsert: false,
    });

  if (uploadError) {
    return { error: `Upload failed: ${uploadError.message}` };
  }

  // TODO: In production, implement actual scoring logic here
  // For now, generate a random score between 0 and 1
  const mockScore = Math.random();

  // Map phase names to database values
  const phaseValue = currentPhase === 'public_test' ? 'public' : 'private';

  // Create submission record
  // @ts-ignore - Supabase types need regeneration
  const { data: submission, error: submissionError } = (await supabase
    .from('submissions')
    .insert({
      user_id: user.id,
      competition_id: competitionId,
      submitted_by: user.id,
      file_path: uploadData.path,
      file_name: file.name,
      file_size_bytes: file.size,
      score: mockScore,
      phase: phaseValue,
      validation_status: 'valid',
      is_best_score: false, // Will be updated by trigger
    })
    .select()
    .single()) as { data: any; error: any };

  if (submissionError) {
    // Clean up uploaded file if submission creation fails
    await supabase.storage.from('submissions').remove([uploadData.path]);
    return { error: `Submission failed: ${submissionError.message}` };
  }

  revalidatePath(`/competitions/${competitionId}`);
  revalidatePath(`/competitions/${competitionId}/submit`);

  return {
    success: true,
    message: 'Submission successful',
    score: mockScore,
    submissionId: submission.id,
  };
}
