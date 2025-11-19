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
  const { data: competition, error: compError } = await supabase
    .from('competitions')
    .select('*')
    .eq('id', competitionId)
    .is('deleted_at', null)
    .single();

  if (compError || !competition) {
    return { error: 'Competition not found' };
  }

  // Check registration status
  const { data: registration } = await supabase
    .from('registrations')
    .select('*')
    .eq('user_id', user.id)
    .eq('competition_id', competitionId)
    .single();

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
    .gte('created_at', todayStart.toISOString());

  if ((dailyCount || 0) >= competition.daily_submission_limit) {
    return { error: 'Daily submission limit reached' };
  }

  // Check total submission limit
  const { count: totalCount } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('competition_id', competitionId);

  if ((totalCount || 0) >= competition.total_submission_limit) {
    return { error: 'Total submission limit reached' };
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

  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return { error: 'File size exceeds 10MB limit' };
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

  // Create submission record
  const { data: submission, error: submissionError } = await supabase
    .from('submissions')
    .insert({
      user_id: user.id,
      competition_id: competitionId,
      file_path: uploadData.path,
      score: mockScore,
      phase: currentPhase,
      is_best_score: false, // Will be updated by trigger
    })
    .select()
    .single();

  if (submissionError) {
    // Clean up uploaded file if submission creation fails
    await supabase.storage.from('submissions').remove([uploadData.path]);
    return { error: `Submission failed: ${submissionError.message}` };
  }

  revalidatePath(`/competitions/${competitionId}`);
  revalidatePath(`/competition/${competitionId}/submit`);

  return {
    success: true,
    message: 'Submission successful',
    score: mockScore,
    submissionId: submission.id,
  };
}

export async function registerForCompetition(competitionId: string) {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Check if competition exists
  const { data: competition, error: compError } = await supabase
    .from('competitions')
    .select('*')
    .eq('id', competitionId)
    .is('deleted_at', null)
    .single();

  if (compError || !competition) {
    return { error: 'Competition not found' };
  }

  // Check if registration is still open
  const now = new Date();
  const registrationEnd = new Date(competition.registration_end);

  if (now > registrationEnd) {
    return { error: 'Registration period has ended' };
  }

  // Check if already registered
  const { data: existingRegistration } = await supabase
    .from('registrations')
    .select('*')
    .eq('user_id', user.id)
    .eq('competition_id', competitionId)
    .single();

  if (existingRegistration) {
    return { error: 'You are already registered for this competition' };
  }

  // Create registration
  const { error: regError } = await supabase.from('registrations').insert({
    user_id: user.id,
    competition_id: competitionId,
    status: 'pending',
  });

  if (regError) {
    return { error: regError.message };
  }

  revalidatePath(`/competitions/${competitionId}`);
  revalidatePath('/dashboard');

  return { success: true, message: 'Registration submitted for approval' };
}
