'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function submitSolution(
  competitionId: string,
  formData: FormData,
  teamId?: string | null
) {
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

  // Check registration status (individual or team)
  let registration: any = null;
  let submissionTeamId: string | null = null;
  let submissionUserId: string | null = null;

  if (competition.participation_type === 'individual') {
    const { data: individualReg } = (await supabase
      .from('registrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('competition_id', competitionId)
      .single()) as { data: any };
    registration = individualReg;
    submissionUserId = user.id;
  } else {
    // Team submission
    if (!teamId) {
      return { error: 'Team ID is required for team competitions' };
    }

    // Check if user is a member of the team
    const { data: membership } = (await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', teamId)
      .eq('user_id', user.id)
      .single()) as { data: any };

    if (!membership) {
      return { error: 'You are not a member of this team' };
    }

    const { data: teamReg } = (await supabase
      .from('registrations')
      .select('*')
      .eq('team_id', teamId)
      .eq('competition_id', competitionId)
      .single()) as { data: any };
    registration = teamReg;
    submissionTeamId = teamId;
  }

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

  // Check daily submission limit (for individual or team)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  let dailyCountQuery = supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .eq('competition_id', competitionId)
    .eq('validation_status', 'valid') // Only count valid submissions
    .gte('submitted_at', todayStart.toISOString());

  if (submissionUserId) {
    dailyCountQuery = dailyCountQuery.eq('user_id', submissionUserId);
  } else if (submissionTeamId) {
    dailyCountQuery = dailyCountQuery.eq('team_id', submissionTeamId);
  }

  const { count: dailyCount } = await dailyCountQuery;

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
  // Use team_id for path if team submission, otherwise user_id
  const pathPrefix = submissionTeamId || user.id;
  const fileName = `${pathPrefix}/${competitionId}/${Date.now()}_${file.name}`;
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('submissions')
    .upload(fileName, file, {
      contentType: 'text/csv',
      upsert: false,
    });

  if (uploadError) {
    return { error: `Upload failed: ${uploadError.message}` };
  }

  // Map phase names to database values
  const phaseValue = currentPhase === 'public_test' ? 'public' : 'private';

  // Create submission record with pending validation status
  const submissionData: any = {
    competition_id: competitionId,
    submitted_by: user.id,
    file_path: uploadData.path,
    file_name: file.name,
    file_size_bytes: file.size,
    score: null, // Will be set by Edge Function
    phase: phaseValue,
    validation_status: 'pending', // Will be updated by Edge Function
    is_best_score: false, // Will be updated by trigger
    user_id: submissionUserId || null,
    team_id: submissionTeamId || null,
  };

  // Use admin client to bypass RLS - we've validated everything at application level
  const { createAdminClient } = await import('@/lib/supabase/server');
  const adminClient = createAdminClient();

  const { data: submission, error: submissionError } = (await adminClient
    .from('submissions')
    // @ts-ignore - Supabase types need regeneration
    .insert(submissionData)
    .select()
    .single()) as { data: any; error: any };

  if (submissionError) {
    // Clean up uploaded file if submission creation fails
    await supabase.storage.from('submissions').remove([uploadData.path]);
    return { error: `Submission failed: ${submissionError.message}` };
  }

  // Call Edge Function to validate and score the submission asynchronously
  // Note: This is a fire-and-forget call. The submission will be scored in the background.
  try {
    await supabase.functions.invoke('validate-csv', {
      body: { submissionId: submission.id },
    });
  } catch (error) {
    console.error('Failed to invoke validation function:', error);
    // Don't fail the submission if Edge Function call fails
    // The submission will remain in 'pending' status and can be retried
  }

  revalidatePath(`/competitions/${competitionId}`);
  revalidatePath(`/competitions/${competitionId}/submit`);

  return {
    success: true,
    message: 'Submission uploaded successfully. Your submission is being validated and scored.',
    submissionId: submission.id,
  };
}
