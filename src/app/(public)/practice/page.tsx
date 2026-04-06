import { createClient } from '@/lib/supabase/server';
import PracticeProblemCard from '@/components/practice/PracticeProblemCard';
import { BookOpen, Search } from 'lucide-react';
import type { PracticeTag, PracticeProblemRow } from '@/types/database.types';

export const metadata = { title: 'Practice Problems – The Noders' };

export default async function PracticePage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; q?: string; difficulty?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  // Fetch all tags for the filter bar
  const { data: tags } = await (supabase as any)
    .from('practice_tags')
    .select('*')
    .order('name');

  // Fetch problems with tags and participant counts
  let query = (supabase as any)
    .from('practice_problems')
    .select('*, practice_problem_tags(tag_id, practice_tags(id, name, slug))')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (params.difficulty) {
    query = query.eq('difficulty', params.difficulty);
  }

  const { data: rawProblems } = await query;

  // Fetch participant counts
  const { data: counts } = await (supabase as any)
    .from('practice_problem_submission_counts')
    .select('problem_id, participant_count');

  const countMap: Record<string, number> = {};
  counts?.forEach((c: any) => { countMap[c.problem_id] = c.participant_count; });

  // Build enriched problems
  let problems = (rawProblems ?? []).map((p: any) => {
    const tags = p.practice_problem_tags
      ?.map((pt: any) => pt.practice_tags)
      .filter(Boolean) as PracticeTag[];
    return {
      ...p,
      tags,
      participant_count: countMap[p.id] ?? 0,
    } as PracticeProblemRow & { tags: PracticeTag[]; participant_count: number };
  });

  // Filter by tag slug
  if (params.tag) {
    problems = problems.filter((p: any) =>
      p.tags.some((t: PracticeTag) => t.slug === params.tag)
    );
  }

  // Search by title/description
  if (params.q) {
    const q = params.q.toLowerCase();
    problems = problems.filter(
      (p: any) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }

  const selectedTag = params.tag ?? '';
  const selectedDifficulty = params.difficulty ?? '';

  const buildUrl = (overrides: Record<string, string | undefined>) => {
    const next = { tag: params.tag, q: params.q, difficulty: params.difficulty, ...overrides };
    const sp = new URLSearchParams();
    Object.entries(next).forEach(([k, v]) => { if (v) sp.set(k, v); });
    const str = sp.toString();
    return '/practice' + (str ? `?${str}` : '');
  };

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <BookOpen className="w-8 h-8 text-primary-blue" />
            <h1 className="font-brand text-4xl sm:text-5xl gradient-text">Practice Problems</h1>
          </div>
          <p className="text-text-secondary max-w-2xl">
            Sharpen your ML skills with permanent practice problems. Submit your predictions anytime
            and compare your score on the global leaderboard.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          {/* Search — purely client-side via form GET */}
          <form method="GET" action="/practice" className="flex-1 min-w-[200px] max-w-xs">
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

          {/* Difficulty filter */}
          <div className="flex gap-2 flex-wrap">
            {[
              { value: '', label: 'All Levels' },
              { value: 'beginner', label: 'Beginner' },
              { value: 'intermediate', label: 'Intermediate' },
              { value: 'advanced', label: 'Advanced' },
            ].map(({ value, label }) => (
              <a
                key={value}
                href={buildUrl({ difficulty: value || undefined })}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  selectedDifficulty === value
                    ? 'bg-primary-blue text-white border-primary-blue'
                    : 'bg-bg-surface text-text-secondary border-border-default hover:border-primary-blue'
                }`}
              >
                {label}
              </a>
            ))}
          </div>
        </div>

        {/* Tag filter */}
        {(tags?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <a
              href={buildUrl({ tag: undefined })}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                !selectedTag
                  ? 'bg-primary-blue text-white border-primary-blue'
                  : 'bg-bg-surface text-text-secondary border-border-default hover:border-primary-blue'
              }`}
            >
              All Topics
            </a>
            {(tags as PracticeTag[] | null)?.map((tag) => (
              <a
                key={tag.id}
                href={buildUrl({ tag: tag.slug })}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
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

        {/* Results count */}
        <p className="text-text-tertiary text-sm mb-6">
          {problems.length} problem{problems.length !== 1 ? 's' : ''} found
        </p>

        {/* Grid */}
        {problems.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {problems.map((problem: any) => (
              <PracticeProblemCard key={problem.id} problem={problem} />
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
