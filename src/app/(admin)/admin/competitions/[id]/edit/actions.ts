'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { CONTEST_TAG } from '@/lib/data/competitions';

const VALID_METRICS = ['f1_score', 'accuracy', 'precision', 'recall', 'mae', 'rmse'];

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, error: 'Not authenticated' };
  const { data: profile } = (await supabase.from('users').select('role').eq('id', user.id).maybeSingle()) as { data: { role: string } | null };
  if (profile?.role !== 'admin') return { supabase, user: null, error: 'Unauthorized - Admin access required' };
  return { supabase, user, error: null };
}

export async function updateCompetition(id: string, formData: FormData) {
  const { supabase, user, error: authError } = await requireAdmin();
  if (!user) return { error: authError ?? 'Not authenticated' };

  const get = (k: string) => (formData.get(k) as string | null) ?? '';
  const title = get('title').trim();
  const description = get('description').trim();
  const problemStatement = get('problemStatement');
  const competitionType = get('competitionType');
  const participationType = get('participationType');
  const scoringMetric = get('scoringMetric');
  const registrationStart = get('registrationStart');
  const registrationEnd = get('registrationEnd');
  const publicTestStart = get('publicTestStart');
  const publicTestEnd = get('publicTestEnd');
  const privateTestStart = get('privateTestStart');
  const privateTestEnd = get('privateTestEnd');
  const dailySubmissionLimit = parseInt(get('dailySubmissionLimit')) || 15;
  const totalSubmissionLimit = parseInt(get('totalSubmissionLimit')) || 10000;
  const maxFileSizeMb = parseInt(get('maxFileSizeMb')) || 10;
  const minTeamSize = participationType === 'team' ? parseInt(get('minTeamSize')) || 1 : null;
  const maxTeamSize = participationType === 'team' ? parseInt(get('maxTeamSize')) || 3 : null;

  if (!title || !description || !registrationStart || !registrationEnd || !publicTestStart || !publicTestEnd) {
    return { error: 'Please fill in all required fields' };
  }
  if (competitionType !== '3-phase' && competitionType !== '4-phase') return { error: 'Invalid competition type' };
  if (participationType !== 'individual' && participationType !== 'team') return { error: 'Invalid participation type' };
  if (!VALID_METRICS.includes(scoringMetric)) return { error: 'Invalid scoring metric' };

  // Same timeline rules as create: phases are back to back and in order.
  const t = (s: string) => new Date(s).getTime();
  if (t(registrationStart) >= t(registrationEnd)) return { error: 'Registration must open before it closes' };
  if (t(registrationEnd) !== t(publicTestStart)) return { error: 'Public test must start when registration closes' };
  if (t(publicTestStart) >= t(publicTestEnd)) return { error: 'Public test must start before it ends' };
  if (competitionType === '4-phase') {
    if (!privateTestStart || !privateTestEnd) return { error: '4-phase competitions need private test dates' };
    if (t(publicTestEnd) !== t(privateTestStart)) return { error: 'Private test must start when the public test ends' };
    if (t(privateTestStart) >= t(privateTestEnd)) return { error: 'Private test must start before it ends' };
  }
  if (minTeamSize !== null && maxTeamSize !== null && (minTeamSize < 1 || minTeamSize > maxTeamSize)) {
    return { error: 'Team size: minimum must be at least 1 and not above the maximum' };
  }

  const { error } = await (supabase as any)
    .from('competitions')
    .update({
      title,
      description,
      problem_statement: problemStatement || description,
      competition_type: competitionType,
      participation_type: participationType,
      scoring_metric: scoringMetric,
      registration_start: new Date(registrationStart).toISOString(),
      registration_end: new Date(registrationEnd).toISOString(),
      public_test_start: new Date(publicTestStart).toISOString(),
      public_test_end: new Date(publicTestEnd).toISOString(),
      private_test_start: competitionType === '4-phase' ? new Date(privateTestStart).toISOString() : null,
      private_test_end: competitionType === '4-phase' ? new Date(privateTestEnd).toISOString() : null,
      dataset_url: get('datasetUrl') || null,
      sample_submission_url: get('sampleSubmissionUrl') || null,
      daily_submission_limit: dailySubmissionLimit,
      total_submission_limit: totalSubmissionLimit,
      max_file_size_mb: maxFileSizeMb,
      min_team_size: minTeamSize,
      max_team_size: maxTeamSize,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating competition:', error);
    return { error: error.message || 'Failed to update competition' };
  }

  revalidateTag(CONTEST_TAG);
  revalidatePath('/admin/competitions');
  revalidatePath('/competitions');
  revalidatePath(`/competitions/${id}`);
  return { success: true };
}

/** Add or replace the answer key for one phase. The scorer reads exactly one test_datasets row per (competition, phase). */
export async function uploadAnswerKey(competitionId: string, formData: FormData) {
  const { supabase, user, error: authError } = await requireAdmin();
  if (!user) return { error: authError ?? 'Not authenticated' };

  const phase = formData.get('phase');
  const file = formData.get('file') as File | null;
  if (phase !== 'public' && phase !== 'private') return { error: 'Invalid phase' };
  if (!file || file.size === 0) return { error: 'Choose a CSV file' };
  if (!file.name.toLowerCase().endsWith('.csv')) return { error: 'Answer key must be a CSV file' };

  const filePath = `answer-keys/${competitionId}_${phase}.csv`;
  const { error: uploadError } = await supabase.storage.from('answer-keys').upload(filePath, file, { contentType: 'text/csv', upsert: true });
  if (uploadError) return { error: `Upload failed: ${uploadError.message}` };

  await supabase.from('test_datasets').delete().eq('competition_id', competitionId).eq('phase', phase);
  const { error: insertError } = await (supabase as any).from('test_datasets').insert({
    competition_id: competitionId,
    phase,
    file_path: filePath,
    file_name: file.name,
    uploaded_by: user.id,
  });
  if (insertError) return { error: `Saved the file but not its record: ${insertError.message}` };

  revalidateTag(CONTEST_TAG);
  revalidatePath(`/admin/competitions/${competitionId}/edit`);
  revalidatePath('/admin/dashboard');
  revalidatePath('/admin/competitions');
  return { success: true, message: `${phase === 'public' ? 'Public' : 'Private'} answer key saved` };
}
