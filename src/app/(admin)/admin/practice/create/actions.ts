'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

const db = (supabase: any) => supabase as any;

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase: null, user: null, error: 'Not authenticated' as string };
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single() as { data: { role: string } | null };
  if (profile?.role !== 'admin') return { supabase: null, user: null, error: 'Unauthorized' as string };
  return { supabase, user, error: null };
}

export async function createPracticeProblem(formData: FormData) {
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
  const answerKey = formData.get('answerKey') as File | null;

  if (!title) return { error: 'Title is required' };
  if (!description) return { error: 'Description is required' };

  const validMetrics = ['f1_score', 'accuracy', 'precision', 'recall', 'mae', 'rmse'];
  if (!scoringMetric || !validMetrics.includes(scoringMetric)) {
    return { error: 'Invalid scoring metric' };
  }

  if (!answerKey || answerKey.size === 0) {
    return { error: 'Answer key CSV is required' };
  }
  if (!answerKey.name.endsWith('.csv')) {
    return { error: 'Answer key must be a CSV file' };
  }

  const validDifficulties = ['beginner', 'intermediate', 'advanced'];
  if (difficulty && !validDifficulties.includes(difficulty)) {
    return { error: 'Invalid difficulty level' };
  }

  // Create problem
  const { data: problem, error: insertError } = await db(supabase)
    .from('practice_problems')
    .insert({
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
      created_by: user.id,
    })
    .select()
    .single();

  if (insertError || !problem) {
    return { error: insertError?.message ?? 'Failed to create practice problem' };
  }

  // Upload answer key
  const filePath = `practice/${problem.id}.csv`;
  const { error: uploadError } = await supabase.storage
    .from('answer-keys')
    .upload(filePath, answerKey, { contentType: 'text/csv', upsert: false });

  if (uploadError) {
    await db(supabase).from('practice_problems').delete().eq('id', problem.id);
    return { error: `Failed to upload answer key: ${uploadError.message}` };
  }

  // Save dataset metadata
  const { error: datasetError } = await db(supabase)
    .from('practice_test_datasets')
    .insert({
      problem_id: problem.id,
      file_path: filePath,
      file_name: answerKey.name,
      uploaded_by: user.id,
    });

  if (datasetError) {
    await supabase.storage.from('answer-keys').remove([filePath]);
    await db(supabase).from('practice_problems').delete().eq('id', problem.id);
    return { error: `Failed to save answer key metadata: ${datasetError.message}` };
  }

  // Associate tags
  if (tagIds.length > 0) {
    const tagRows = tagIds.map((tag_id: string) => ({ problem_id: problem.id, tag_id }));
    await db(supabase).from('practice_problem_tags').insert(tagRows);
  }

  revalidatePath('/admin/practice');
  revalidatePath('/practice');
  revalidatePath('/');

  return { success: true, problemId: problem.id };
}
