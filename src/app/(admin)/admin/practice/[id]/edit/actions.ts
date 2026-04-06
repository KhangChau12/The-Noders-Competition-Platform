'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase: null, user: null, error: 'Not authenticated' as string };
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single() as { data: { role: string } | null };
  if (profile?.role !== 'admin') return { supabase: null, user: null, error: 'Unauthorized' as string };
  return { supabase, user, error: null };
}

// Cast to any to bypass Supabase type checking for new tables not yet reflected in generated types
const db = (supabase: any) => supabase as any;

export async function updatePracticeProblem(id: string, formData: FormData) {
  const { supabase, user, error } = await requireAdmin();
  if (error || !supabase || !user) return { error };

  const title = (formData.get('title') as string)?.trim();
  const description = (formData.get('description') as string)?.trim();
  const problemStatement = (formData.get('problemStatement') as string)?.trim();
  const scoringMetric = formData.get('scoringMetric') as string;
  const difficulty = (formData.get('difficulty') as string) || null;
  const datasetUrl = (formData.get('datasetUrl') as string)?.trim() || null;
  const sampleSubmissionUrl = (formData.get('sampleSubmissionUrl') as string)?.trim() || null;
  const dailyLimit = parseInt(formData.get('dailySubmissionLimit') as string) || 15;
  const totalLimit = parseInt(formData.get('totalSubmissionLimit') as string) || 0;
  const maxFileSizeMb = parseInt(formData.get('maxFileSizeMb') as string) || 10;
  const tagIds = formData.getAll('tagIds') as string[];
  const newAnswerKey = formData.get('answerKey') as File | null;

  if (!title) return { error: 'Title is required' };
  if (!description) return { error: 'Description is required' };

  const validMetrics = ['f1_score', 'accuracy', 'precision', 'recall', 'mae', 'rmse'];
  if (!scoringMetric || !validMetrics.includes(scoringMetric)) return { error: 'Invalid scoring metric' };

  // Update problem
  const { error: updateError } = await db(supabase)
    .from('practice_problems')
    .update({
      title,
      description,
      problem_statement: problemStatement || description,
      scoring_metric: scoringMetric,
      difficulty: difficulty || null,
      dataset_url: datasetUrl,
      sample_submission_url: sampleSubmissionUrl,
      daily_submission_limit: dailyLimit,
      total_submission_limit: totalLimit,
      max_file_size_mb: maxFileSizeMb,
    })
    .eq('id', id);

  if (updateError) return { error: updateError.message };

  // Update tags: delete all existing, re-insert selected
  await db(supabase).from('practice_problem_tags').delete().eq('problem_id', id);
  if (tagIds.length > 0) {
    await db(supabase).from('practice_problem_tags').insert(
      tagIds.map((tag_id: string) => ({ problem_id: id, tag_id }))
    );
  }

  // Upload new answer key if provided
  if (newAnswerKey && newAnswerKey.size > 0) {
    if (!newAnswerKey.name.endsWith('.csv')) return { error: 'Answer key must be a CSV file' };

    const filePath = `practice/${id}.csv`;
    const { error: uploadError } = await supabase.storage
      .from('answer-keys')
      .upload(filePath, newAnswerKey, { contentType: 'text/csv', upsert: true });

    if (uploadError) return { error: `Failed to upload answer key: ${uploadError.message}` };

    // Upsert dataset metadata
    const { data: existing } = await db(supabase)
      .from('practice_test_datasets')
      .select('id')
      .eq('problem_id', id)
      .single();

    if (existing) {
      await db(supabase)
        .from('practice_test_datasets')
        .update({ file_path: filePath, file_name: newAnswerKey.name })
        .eq('problem_id', id);
    } else {
      await db(supabase).from('practice_test_datasets').insert({
        problem_id: id,
        file_path: filePath,
        file_name: newAnswerKey.name,
        uploaded_by: user.id,
      });
    }
  }

  revalidatePath('/admin/practice');
  revalidatePath(`/admin/practice/${id}/edit`);
  revalidatePath(`/practice/${id}`);
  revalidatePath('/practice');

  return { success: true };
}

export async function deletePracticeProblem(id: string) {
  const { supabase, error } = await requireAdmin();
  if (error || !supabase) return { error };

  const { error: deleteError } = await db(supabase)
    .from('practice_problems')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (deleteError) return { error: deleteError.message };

  revalidatePath('/admin/practice');
  revalidatePath('/practice');
  return { success: true };
}
