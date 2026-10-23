import type { SupabaseClient } from '@supabase/supabase-js';
import { higherIsBetter } from '@/lib/leaderboard';
import { domainFromTags, type Domain } from '@/lib/ui/phase';

export interface PracticeTagLite {
  id: string;
  name: string;
  slug: string;
}

export interface PracticeSummary {
  id: string;
  title: string;
  description: string;
  scoring_metric: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | null;
  daily_submission_limit: number;
  created_at: string;
  tags: PracticeTagLite[];
  domain: Domain;
  solvers: number;
  validSubmissions: number;
  topScore: number | null;
  topHolder: string | null;
  yourBest: number | null;
  yourRank: number | null;
}

/** Every live practice problem, with board stats and (optionally) the viewer's standing. */
export async function getPracticeSummaries(supabase: SupabaseClient, userId?: string | null): Promise<PracticeSummary[]> {
  const [{ data: problems }, { data: counts }, { data: best }] = await Promise.all([
    supabase
      .from('practice_problems')
      .select('id, title, description, scoring_metric, difficulty, daily_submission_limit, created_at, practice_problem_tags(practice_tags(id, name, slug))')
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
    supabase.from('practice_problem_submission_counts').select('problem_id, participant_count, valid_submission_count'),
    supabase
      .from('practice_submissions')
      .select('problem_id, user_id, score, submitted_at, users(full_name)')
      .eq('is_best_score', true)
      .eq('validation_status', 'valid')
      .not('score', 'is', null),
  ]);

  const countMap = new Map<string, { participant_count: number; valid_submission_count: number }>();
  for (const c of (counts ?? []) as { problem_id: string; participant_count: number; valid_submission_count: number }[]) {
    countMap.set(c.problem_id, c);
  }

  type BestRow = { problem_id: string; user_id: string; score: number; submitted_at: string; users: { full_name: string | null } | { full_name: string | null }[] | null };
  const byProblem = new Map<string, BestRow[]>();
  for (const r of (best ?? []) as BestRow[]) {
    const arr = byProblem.get(r.problem_id) ?? [];
    arr.push(r);
    byProblem.set(r.problem_id, arr);
  }

  return ((problems ?? []) as any[]).map((p) => {
    const tags: PracticeTagLite[] = (p.practice_problem_tags ?? []).map((pt: any) => pt.practice_tags).filter(Boolean);
    const entries = (byProblem.get(p.id) ?? []).slice();
    const hib = higherIsBetter(p.scoring_metric);
    entries.sort((a, b) => (a.score === b.score ? a.submitted_at.localeCompare(b.submitted_at) : hib ? b.score - a.score : a.score - b.score));
    const top = entries[0];
    const holder = top ? (Array.isArray(top.users) ? top.users[0]?.full_name : top.users?.full_name) ?? null : null;
    const yourIdx = userId ? entries.findIndex((e) => e.user_id === userId) : -1;
    const c = countMap.get(p.id);

    return {
      id: p.id,
      title: p.title,
      description: p.description ?? '',
      scoring_metric: p.scoring_metric,
      difficulty: p.difficulty,
      daily_submission_limit: p.daily_submission_limit,
      created_at: p.created_at,
      tags,
      domain: domainFromTags(tags),
      solvers: c?.participant_count ?? entries.length,
      validSubmissions: c?.valid_submission_count ?? 0,
      topScore: top?.score ?? null,
      topHolder: holder,
      yourBest: yourIdx >= 0 ? entries[yourIdx].score : null,
      yourRank: yourIdx >= 0 ? yourIdx + 1 : null,
    };
  });
}
