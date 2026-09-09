import { createClient } from '@/lib/supabase/server';
import PracticeProblemCard from '@/components/practice/PracticeProblemCard';
import { StatRun } from '@/components/ui/StatRun';
import { Search } from 'lucide-react';
import { SCORING_METRIC_INFO } from '@/lib/constants';
import type { PracticeTag, PracticeProblemRow } from '@/types/database.types';

export const metadata = { title: 'Practice Problems – The Noders' };

type EnrichedProblem = PracticeProblemRow & {
  tags: PracticeTag[];
  participant_count: number;
};

export default async function PracticePage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; q?: string; difficulty?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // All four reads are independent — run them concurrently instead of serially.
  const [
    { data: tags },
    { data: rawProblems },
    { data: counts },
    { data: bestEntries },
  ] = await Promise.all([
    // Tags for the filter bar
    (supabase as any).from('practice_tags').select('id, name, slug, created_at').order('name'),
    // All problems with tags (filters applied in JS so header stats reflect the full set)
    (supabase as any)
      .from('practice_problems')
      .select('id, title, description, problem_statement, scoring_metric, dataset_url, sample_submission_url, daily_submission_limit, total_submission_limit, max_file_size_mb, difficulty, created_by, created_at, updated_at, deleted_at, practice_problem_tags(tag_id, practice_tags(id, name, slug))')
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
    // Participant + submission counts
    (supabase as any)
      .from('practice_problem_submission_counts')
      .select('problem_id, participant_count, total_submission_count'),
    // Global leaderboard entries: every user's best valid score per problem.
    // Used to derive the top score and (when logged in) the user's rank on each problem.
    (supabase as any)
      .from('practice_submissions')
      .select('problem_id, user_id, score')
      .eq('is_best_score', true)
      .eq('validation_status', 'valid')
      .not('score', 'is', null),
  ]);

  const countMap: Record<string, number> = {};
  let totalSubmissions = 0;
  counts?.forEach((c: any) => {
    countMap[c.problem_id] = c.participant_count;
    totalSubmissions += c.total_submission_count ?? 0;
  });

  const entriesByProblem: Record<string, { user_id: string; score: number }[]> = {};
  (bestEntries ?? []).forEach((e: any) => {
    (entriesByProblem[e.problem_id] ??= []).push({ user_id: e.user_id, score: e.score });
  });

  const allProblems: EnrichedProblem[] = (rawProblems ?? []).map((p: any) => ({
    ...p,
    tags: (p.practice_problem_tags ?? [])
      .map((pt: any) => pt.practice_tags)
      .filter(Boolean) as PracticeTag[],
    participant_count: countMap[p.id] ?? 0,
  }));

  // Per-problem top score + the logged-in user's rank and best score
  const topScores: Record<string, number> = {};
  const yourRanks: Record<string, number> = {};
  const bestScores: Record<string, number> = {};
  allProblems.forEach((p) => {
    const entries = entriesByProblem[p.id];
    if (!entries || entries.length === 0) return;
    const higherIsBetter =
      SCORING_METRIC_INFO[p.scoring_metric as keyof typeof SCORING_METRIC_INFO]
        ?.higher_is_better !== false;
    entries.sort((a, b) => (higherIsBetter ? b.score - a.score : a.score - b.score));
    topScores[p.id] = entries[0].score;
    if (user) {
      const idx = entries.findIndex((e) => e.user_id === user.id);
      if (idx >= 0) {
        yourRanks[p.id] = idx + 1;
        bestScores[p.id] = entries[idx].score;
      }
    }
  });

  // Apply filters
  let problems = allProblems;

  if (params.difficulty) {
    problems = problems.filter((p) => p.difficulty === params.difficulty);
  }

  if (params.tag) {
    problems = problems.filter((p) => p.tags.some((t) => t.slug === params.tag));
  }

  if (params.q) {
    const q = params.q.toLowerCase();
    problems = problems.filter(
      (p) => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
    );
  }

  const selectedTag = params.tag ?? '';
  const selectedDifficulty = params.difficulty ?? '';
  const attemptedCount = Object.keys(bestScores).length;
  const isFiltering = Boolean(params.q || params.tag || params.difficulty);

  // Personal progress summary (logged in, has attempted at least one problem)
  const bestRank = Object.values(yourRanks).length
    ? Math.min(...Object.values(yourRanks))
    : null;
  const top3Count = Object.values(yourRanks).filter((r) => r <= 3).length;
  const progressPct = allProblems.length
    ? Math.round((attemptedCount / allProblems.length) * 100)
    : 0;

  const buildUrl = (overrides: Record<string, string | undefined>) => {
    const next = { tag: params.tag, q: params.q, difficulty: params.difficulty, ...overrides };
    const sp = new URLSearchParams();
    Object.entries(next).forEach(([k, v]) => { if (v) sp.set(k, v); });
    const str = sp.toString();
    return '/practice' + (str ? `?${str}` : '');
  };

  return (
    <div className="min-h-screen px-4 sm:px-6 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto">
        {/* Header — h1 + tertiary subtitle + a stat run */}
        <div className="mb-6 sm:mb-10">
          <h1 className="text-2xl font-bold tracking-[-0.01em] text-text-primary mb-1">
            Practice Problems
          </h1>
          <p className="text-sm text-text-tertiary mb-5">
            Permanent problems with a global leaderboard. Submit anytime.
          </p>
          <StatRun
            items={[
              { label: 'Problems', value: String(allProblems.length) },
              { label: 'Topics', value: String(tags?.length ?? 0) },
              { label: 'Submissions', value: totalSubmissions.toLocaleString() },
            ]}
          />
        </div>

        {/* Personal progress strip — labelled bar + a stat run, no box */}
        {user && attemptedCount > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-end gap-6 sm:gap-8 mb-6 sm:mb-10">
            <div className="flex-1 min-w-0 sm:max-w-md">
              <p className="text-xs font-semibold uppercase tracking-[0.09em] text-text-tertiary mb-[9px]">
                Your progress
              </p>
              <div className="h-[5px] bg-bg-elevated rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-blue to-accent-cyan rounded-full"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
            <StatRun
              size="sm"
              items={[
                {
                  label: 'Attempted',
                  value: (
                    <>
                      {attemptedCount}
                      <span className="text-xs font-normal text-text-disabled"> / {allProblems.length}</span>
                    </>
                  ),
                },
                ...(bestRank !== null
                  ? [{ label: 'Best rank', value: `#${bestRank}`, tone: 'blue' as const }]
                  : []),
                ...(top3Count > 0
                  ? [{ label: 'Top-3 finishes', value: String(top3Count), tone: 'warn' as const }]
                  : []),
              ]}
            />
          </div>
        )}

        {/* Toolbar — bottom-border search + underline-link difficulty control */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 sm:items-end mb-4">
          <form method="GET" action="/practice" className="flex-1 sm:max-w-sm">
            {params.tag && <input type="hidden" name="tag" value={params.tag} />}
            {params.difficulty && <input type="hidden" name="difficulty" value={params.difficulty} />}
            <div className="relative">
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                name="q"
                type="text"
                placeholder="Search problems…"
                defaultValue={params.q ?? ''}
                className="w-full min-h-[44px] sm:min-h-0 bg-transparent border-0 border-b border-border-subtle pl-6 pr-2 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary-blue"
              />
            </div>
          </form>

          <div className="flex gap-4 sm:gap-[18px] overflow-x-auto scrollbar-none">
            {[
              { value: '', label: 'All levels' },
              { value: 'beginner', label: 'Beginner' },
              { value: 'intermediate', label: 'Intermediate' },
              { value: 'advanced', label: 'Advanced' },
            ].map(({ value, label }) => (
              <a
                key={value}
                href={buildUrl({ difficulty: value || undefined })}
                className={`min-h-[44px] sm:min-h-0 flex items-center shrink-0 border-b-2 py-1 text-xs font-bold uppercase tracking-[0.04em] whitespace-nowrap transition-colors ${
                  selectedDifficulty === value
                    ? 'border-primary-blue text-text-primary'
                    : 'border-transparent text-text-tertiary hover:text-text-secondary'
                }`}
              >
                {label}
              </a>
            ))}
          </div>
        </div>

        {/* Topic filter — underline-link row */}
        {(tags?.length ?? 0) > 0 && (
          <div className="flex items-center gap-4 sm:gap-[18px] mb-6 sm:mb-8 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap text-xs">
            <a
              href={buildUrl({ tag: undefined })}
              className={`shrink-0 whitespace-nowrap font-bold transition-colors ${
                !selectedTag ? 'text-[#60A5FA]' : 'text-text-tertiary hover:text-text-secondary'
              }`}
            >
              All topics
            </a>
            {(tags as PracticeTag[] | null)?.map((tag) => (
              <a
                key={tag.id}
                href={buildUrl({ tag: tag.slug })}
                className={`shrink-0 whitespace-nowrap font-bold transition-colors ${
                  selectedTag === tag.slug
                    ? 'text-[#60A5FA]'
                    : 'text-text-tertiary hover:text-text-secondary'
                }`}
              >
                {tag.name}
              </a>
            ))}
          </div>
        )}

        {/* Results count (only meaningful while filtering) */}
        {isFiltering && (
          <p className="text-text-tertiary text-sm mb-6">
            {problems.length} problem{problems.length !== 1 ? 's' : ''} found
          </p>
        )}

        {/* Grid */}
        {problems.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {problems.map((problem) => (
              <PracticeProblemCard
                key={problem.id}
                problem={problem}
                bestScore={bestScores[problem.id] ?? null}
                topScore={topScores[problem.id] ?? null}
                yourRank={yourRanks[problem.id] ?? null}
              />
            ))}
          </div>
        ) : (
          <div className="border-y border-border-subtle py-16 text-center">
            <p className="text-lg font-extrabold text-text-primary mb-2">No problems found</p>
            <p className="text-sm text-text-tertiary">Try adjusting your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
