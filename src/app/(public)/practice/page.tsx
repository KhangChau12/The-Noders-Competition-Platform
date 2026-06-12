import { createClient } from '@/lib/supabase/server';
import PracticeProblemCard from '@/components/practice/PracticeProblemCard';
import { BookOpen, Search, Flame } from 'lucide-react';
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

  // Fetch all tags for the filter bar
  const { data: tags } = await (supabase as any)
    .from('practice_tags')
    .select('*')
    .order('name');

  // Fetch all problems with tags (filters applied in JS so header stats reflect the full set)
  const { data: rawProblems } = await (supabase as any)
    .from('practice_problems')
    .select('*, practice_problem_tags(tag_id, practice_tags(id, name, slug))')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  // Fetch participant + submission counts
  const { data: counts } = await (supabase as any)
    .from('practice_problem_submission_counts')
    .select('problem_id, participant_count, total_submission_count');

  const countMap: Record<string, number> = {};
  let totalSubmissions = 0;
  counts?.forEach((c: any) => {
    countMap[c.problem_id] = c.participant_count;
    totalSubmissions += c.total_submission_count ?? 0;
  });

  // Global leaderboard entries: every user's best valid score per problem.
  // Used to derive the top score and (when logged in) the user's rank on each problem.
  const { data: bestEntries } = await (supabase as any)
    .from('practice_submissions')
    .select('problem_id, user_id, score')
    .eq('is_best_score', true)
    .eq('validation_status', 'valid')
    .not('score', 'is', null);

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
        {/* Header */}
        <div className="relative mb-6 sm:mb-10 overflow-hidden">
          <BookOpen className="absolute -top-4 -right-6 h-32 w-32 text-primary-blue/10 rotate-[10deg] pointer-events-none hidden sm:block [filter:drop-shadow(0_0_20px_rgba(37,99,235,0.25))]" />
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-cyan mb-2">
            Self-paced · Always open
          </p>
          <h1 className="font-brand text-3xl sm:text-4xl md:text-5xl gradient-text mb-3 leading-tight">
            Practice Problems
          </h1>
          <p className="text-sm sm:text-base text-text-secondary max-w-2xl mb-3 sm:mb-4">
            Sharpen your ML skills with permanent practice problems. Submit your predictions anytime
            and compare your score on the global leaderboard.
          </p>
          <p className="text-xs font-mono uppercase tracking-wide text-text-tertiary">
            {allProblems.length} problem{allProblems.length !== 1 ? 's' : ''}
            {' · '}{tags?.length ?? 0} topic{(tags?.length ?? 0) !== 1 ? 's' : ''}
            {' · '}{totalSubmissions} submission{totalSubmissions !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Personal progress strip */}
        {user && attemptedCount > 0 && (
          <div className="relative overflow-hidden mb-6 sm:mb-8 rounded-xl border border-border-default bg-bg-surface p-4 sm:p-5">
            <Flame className="absolute -bottom-5 -right-4 h-20 w-20 text-accent-cyan/[0.08] rotate-[-10deg] pointer-events-none select-none [filter:drop-shadow(0_0_18px_rgba(6,182,212,0.3))]" />
            <div className="relative flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-8">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent-cyan mb-2">
                  Your progress
                </p>
                <div className="flex items-center gap-3">
                  <div className="relative h-2 flex-1 bg-bg-elevated rounded-full overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-blue to-accent-cyan rounded-full"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-text-secondary whitespace-nowrap">
                    {attemptedCount}/{allProblems.length} attempted
                  </span>
                </div>
              </div>
              <div className="flex items-baseline sm:items-center gap-6 sm:gap-8 shrink-0">
                {bestRank !== null && (
                  <div className="flex items-baseline gap-2 sm:block">
                    <p className="text-lg sm:text-2xl font-bold font-mono text-text-primary leading-none sm:mb-1">
                      #{bestRank}
                    </p>
                    <p className="text-[11px] uppercase tracking-wide text-text-tertiary">
                      Best rank
                    </p>
                  </div>
                )}
                {top3Count > 0 && (
                  <div className="flex items-baseline gap-2 sm:block">
                    <p className="text-lg sm:text-2xl font-bold font-mono text-warning leading-none sm:mb-1">
                      {top3Count}
                    </p>
                    <p className="text-[11px] uppercase tracking-wide text-text-tertiary">
                      Top-3 finishes
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Toolbar: search + difficulty */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <form method="GET" action="/practice" className="flex-1 sm:max-w-sm">
            {params.tag && <input type="hidden" name="tag" value={params.tag} />}
            {params.difficulty && <input type="hidden" name="difficulty" value={params.difficulty} />}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                name="q"
                type="text"
                placeholder="Search problems..."
                defaultValue={params.q ?? ''}
                className="w-full pl-10 pr-4 py-2.5 bg-bg-surface border border-border-default rounded-lg text-sm focus:outline-none focus:border-border-focus text-text-primary"
              />
            </div>
          </form>

          {/* Difficulty segmented control: full-width equal segments on phones */}
          <div className="flex w-full sm:w-auto sm:inline-flex sm:self-start rounded-lg border border-border-default bg-bg-surface p-1">
            {[
              { value: '', label: 'All', fullLabel: 'All Levels' },
              { value: 'beginner', label: 'Beginner', fullLabel: 'Beginner' },
              { value: 'intermediate', label: 'Medium', fullLabel: 'Intermediate' },
              { value: 'advanced', label: 'Advanced', fullLabel: 'Advanced' },
            ].map(({ value, label, fullLabel }) => (
              <a
                key={value}
                href={buildUrl({ difficulty: value || undefined })}
                className={`flex-1 sm:flex-none text-center px-2 sm:px-3 py-2 sm:py-1.5 rounded-md text-[13px] sm:text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedDifficulty === value
                    ? 'bg-primary-blue text-white'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <span className="sm:hidden">{label}</span>
                <span className="hidden sm:inline">{fullLabel}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Topic filter: edge-to-edge swipe row on phones, wrapping row on larger screens */}
        {(tags?.length ?? 0) > 0 && (
          <div className="flex items-center gap-2 mb-6 sm:mb-8 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
            <span className="text-xs font-mono uppercase tracking-wide text-text-tertiary mr-1 shrink-0">
              Topics
            </span>
            <a
              href={buildUrl({ tag: undefined })}
              className={`shrink-0 whitespace-nowrap px-3 py-1.5 sm:py-1 rounded-full text-xs font-medium border transition-colors ${
                !selectedTag
                  ? 'bg-primary-blue text-white border-primary-blue'
                  : 'bg-bg-surface text-text-secondary border-border-default hover:border-primary-blue'
              }`}
            >
              All
            </a>
            {(tags as PracticeTag[] | null)?.map((tag) => (
              <a
                key={tag.id}
                href={buildUrl({ tag: tag.slug })}
                className={`shrink-0 whitespace-nowrap px-3 py-1.5 sm:py-1 rounded-full text-xs font-medium border transition-colors ${
                  selectedTag === tag.slug
                    ? 'bg-primary-blue text-white border-primary-blue'
                    : 'bg-bg-surface text-text-secondary border-border-default hover:border-primary-blue'
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
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
          <div className="py-24 text-center text-text-tertiary">
            <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-40" />
            <p className="text-lg mb-2">No problems found</p>
            <p className="text-sm">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
