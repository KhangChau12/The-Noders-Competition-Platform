'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createCompetition(formData: FormData) {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Check admin role
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
  const competitionType = formData.get('competitionType') as string;
  const participationType = formData.get('participationType') as string;
  const scoringMetric = formData.get('scoringMetric') as string;
  const registrationStart = formData.get('registrationStart') as string;
  const registrationEnd = formData.get('registrationEnd') as string;
  const publicTestStart = formData.get('publicTestStart') as string;
  const publicTestEnd = formData.get('publicTestEnd') as string;
  const privateTestStart = formData.get('privateTestStart') as string;
  const privateTestEnd = formData.get('privateTestEnd') as string;
  const dailySubmissionLimit = parseInt(formData.get('dailySubmissionLimit') as string);
  const maxFileSizeMb = parseInt(formData.get('maxFileSizeMb') as string);
  const datasetUrl = formData.get('datasetUrl') as string;
  const sampleSubmissionUrl = formData.get('sampleSubmissionUrl') as string;

  // Extract answer key files
  const publicAnswerKey = formData.get('publicAnswerKey') as File | null;
  const privateAnswerKey = formData.get('privateAnswerKey') as File | null;

  // Team size (only for team competitions)
  const minTeamSize = participationType === 'team'
    ? parseInt(formData.get('minTeamSize') as string) || 1
    : null;
  const maxTeamSize = participationType === 'team'
    ? parseInt(formData.get('maxTeamSize') as string) || 3
    : null;

  // Validation
  if (!title || !description) {
    return { error: 'Title and description are required' };
  }

  if (!registrationStart || !registrationEnd || !publicTestStart || !publicTestEnd) {
    return { error: 'All timeline dates are required' };
  }

  // Validate answer key files
  if (!publicAnswerKey || publicAnswerKey.size === 0) {
    return { error: 'Public test answer key is required' };
  }

  if (!publicAnswerKey.name.endsWith('.csv')) {
    return { error: 'Public answer key must be a CSV file' };
  }

  if (competitionType === '4-phase') {
    if (!privateAnswerKey || privateAnswerKey.size === 0) {
      return { error: 'Private test answer key is required for 4-phase competitions' };
    }
    if (!privateAnswerKey.name.endsWith('.csv')) {
      return { error: 'Private answer key must be a CSV file' };
    }
  }

  // Validate competition type
  if (competitionType !== '3-phase' && competitionType !== '4-phase') {
    return { error: 'Invalid competition type' };
  }

  // Validate scoring metric
  const validMetrics = ['f1_score', 'accuracy', 'precision', 'recall', 'mae', 'rmse'];
  if (!scoringMetric || !validMetrics.includes(scoringMetric)) {
    return { error: 'Invalid scoring metric. Must be one of: f1_score, accuracy, precision, recall, mae, rmse' };
  }

  // Validate 4-phase requirements
  if (competitionType === '4-phase') {
    if (!privateTestStart || !privateTestEnd) {
      return { error: '4-phase competitions require private test phase dates' };
    }
  }

  // Validate timeline order
  const regStart = new Date(registrationStart);
  const regEnd = new Date(registrationEnd);
  const pubStart = new Date(publicTestStart);
  const pubEnd = new Date(publicTestEnd);

  const now = new Date();
  if (regStart < now) {
    return { error: 'Competition start date must be in the future' };
  }

  if (regStart >= regEnd) {
    return { error: 'Registration start must be before registration end' };
  }

  if (regEnd.getTime() !== pubStart.getTime()) {
    return { error: 'Public test must start immediately after registration ends' };
  }

  if (pubStart >= pubEnd) {
    return { error: 'Public test start must be before public test end' };
  }

  if (competitionType === '4-phase' && privateTestStart && privateTestEnd) {
    const privStart = new Date(privateTestStart);
    const privEnd = new Date(privateTestEnd);

    if (pubEnd.getTime() !== privStart.getTime()) {
      return { error: 'Private test must start immediately after public test ends' };
    }

    if (privStart >= privEnd) {
      return { error: 'Private test start must be before private test end' };
    }
  }

  // Validate team sizes
  if (participationType === 'team') {
    if (!minTeamSize || !maxTeamSize) {
      return { error: 'Team competitions require team size limits' };
    }
    if (minTeamSize > maxTeamSize) {
      return { error: 'Minimum team size cannot be greater than maximum team size' };
    }
    if (minTeamSize < 1) {
      return { error: 'Minimum team size must be at least 1' };
    }
  }

  // Create competition
  // @ts-ignore - Supabase types need regeneration
  const { data: competition, error: createError } = (await supabase.from('competitions').insert({
      title,
      description,
      problem_statement: problemStatement || description,
      competition_type: competitionType,
      participation_type: participationType,
      registration_start: registrationStart,
      registration_end: registrationEnd,
      public_test_start: publicTestStart,
      public_test_end: publicTestEnd,
      private_test_start: competitionType === '4-phase' ? privateTestStart : null,
      private_test_end: competitionType === '4-phase' ? privateTestEnd : null,
      daily_submission_limit: dailySubmissionLimit,
      max_file_size_mb: maxFileSizeMb,
      min_team_size: minTeamSize,
      max_team_size: maxTeamSize,
      dataset_url: datasetUrl || null,
      sample_submission_url: sampleSubmissionUrl || null,
      scoring_metric: scoringMetric || 'f1_score',
      created_by: user.id,
    })
    .select()
    .single()) as { data: any; error: any };

  if (createError) {
    console.error('Competition creation error:', createError);
    return { error: createError.message };
  }

  // Upload answer key files to Supabase Storage
  try {
    // Upload public answer key
    // @ts-ignore - competition type needs fixing
    const publicFileName = `${competition.id}_public.csv`;
    const publicFilePath = `answer-keys/${publicFileName}`;

    const { error: publicUploadError } = await supabase.storage
      .from('answer-keys')
      .upload(publicFilePath, publicAnswerKey, {
        contentType: 'text/csv',
        upsert: false,
      });

    if (publicUploadError) {
      // Rollback: Delete the competition
      // @ts-ignore - competition type needs fixing
      await supabase.from('competitions').delete().eq('id', competition.id);
      return { error: `Failed to upload public answer key: ${publicUploadError.message}` };
    }

    // Save public answer key metadata to test_datasets table
    // @ts-ignore - Supabase types need regeneration
    const { error: publicDatasetError } = await supabase.from('test_datasets').insert({
        competition_id: competition.id,
        phase: 'public',
        file_path: publicFilePath,
        file_name: publicAnswerKey.name,
        uploaded_by: user.id,
      });

    if (publicDatasetError) {
      // Rollback: Delete uploaded file and competition
      await supabase.storage.from('answer-keys').remove([publicFilePath]);
      await supabase.from('competitions').delete().eq('id', competition.id);
      return { error: `Failed to save public answer key metadata: ${publicDatasetError.message}` };
    }

    // Upload private answer key (if 4-phase)
    if (competitionType === '4-phase' && privateAnswerKey) {
      const privateFileName = `${competition.id}_private.csv`;
      const privateFilePath = `answer-keys/${privateFileName}`;

      const { error: privateUploadError } = await supabase.storage
        .from('answer-keys')
        .upload(privateFilePath, privateAnswerKey, {
          contentType: 'text/csv',
          upsert: false,
        });

      if (privateUploadError) {
        // Rollback: Delete everything
        await supabase.storage.from('answer-keys').remove([publicFilePath]);
        await supabase.from('test_datasets').delete().eq('competition_id', competition.id);
        await supabase.from('competitions').delete().eq('id', competition.id);
        return { error: `Failed to upload private answer key: ${privateUploadError.message}` };
      }

      // Save private answer key metadata
      // @ts-ignore - Supabase types need regeneration
      const { error: privateDatasetError } = await supabase.from('test_datasets').insert({
          competition_id: competition.id,
          phase: 'private',
          file_path: privateFilePath,
          file_name: privateAnswerKey.name,
          uploaded_by: user.id,
        });

      if (privateDatasetError) {
        // Rollback: Delete everything
        await supabase.storage.from('answer-keys').remove([publicFilePath, privateFilePath]);
        await supabase.from('test_datasets').delete().eq('competition_id', competition.id);
        await supabase.from('competitions').delete().eq('id', competition.id);
        return { error: `Failed to save private answer key metadata: ${privateDatasetError.message}` };
      }
    }
  } catch (error) {
    // Rollback on any unexpected error
    await supabase.from('competitions').delete().eq('id', competition.id);
    return { error: `Unexpected error during file upload: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }

  revalidatePath('/admin/competitions');
  revalidatePath('/competitions');
  revalidatePath('/');

  return { success: true, competitionId: competition.id };
}
