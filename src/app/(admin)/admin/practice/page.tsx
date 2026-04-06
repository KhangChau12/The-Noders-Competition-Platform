import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import DeletePracticeProblemButton from './DeletePracticeProblemButton';
import { BookOpen, Plus, Edit2, Eye, Tag, Target } from 'lucide-react';
import { SCORING_METRIC_INFO, PRACTICE_DIFFICULTY_INFO } from '@/lib/constants';

export const metadata = { title: 'Manage Practice Problems' };

export default async function AdminPracticePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single() as { data: { role: string } | null };
  if (profile?.role !== 'admin') redirect('/dashboard');

  // Fetch problems with tag info
  const { data: problems } = await (supabase as any)
    .from('practice_problems')
    .select('*, practice_problem_tags(tag_id, practice_tags(id, name, slug))')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  // Fetch submission counts
  const { data: counts } = await (supabase as any)
    .from('practice_problem_submission_counts')
    .select('*');

  const countMap: Record<string, { participant_count: number; valid_submission_count: number }> = {};
  counts?.forEach((c: any) => { countMap[c.problem_id] = c; });

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-brand text-4xl sm:text-5xl mb-2 gradient-text">Practice Problems</h1>
            <p className="text-text-secondary">Manage permanent practice problems for participants</p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/practice/tags">
              <Button variant="outline" size="lg">
                <Tag className="w-4 h-4 mr-2" />
                Manage Tags
              </Button>
            </Link>
            <Link href="/admin/practice/create">
              <Button variant="primary" size="lg">
                <Plus className="w-5 h-5 mr-2" />
                Create New
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 border-l-4 border-primary-blue">
            <div className="flex items-center justify-between mb-2">
              <div className="text-text-tertiary text-sm">Total Problems</div>
              <BookOpen className="w-5 h-5 text-primary-blue" />
            </div>
            <div className="text-3xl font-bold text-primary-blue">{problems?.length ?? 0}</div>
          </Card>

          <Card className="p-6 border-l-4 border-success">
            <div className="flex items-center justify-between mb-2">
              <div className="text-text-tertiary text-sm">Total Participants</div>
              <Target className="w-5 h-5 text-success" />
            </div>
            <div className="text-3xl font-bold text-success">
              {Object.values(countMap).reduce((sum, c) => sum + (c.participant_count ?? 0), 0)}
            </div>
          </Card>

          <Card className="p-6 border-l-4 border-accent-cyan">
            <div className="flex items-center justify-between mb-2">
              <div className="text-text-tertiary text-sm">Valid Submissions</div>
              <Target className="w-5 h-5 text-accent-cyan" />
            </div>
            <div className="text-3xl font-bold text-accent-cyan">
              {Object.values(countMap).reduce((sum, c) => sum + (c.valid_submission_count ?? 0), 0)}
            </div>
          </Card>
        </div>

        {/* Problems List */}
        <Card className="overflow-hidden">
          <div className="p-6 border-b border-border-default bg-bg-tertiary">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              All Practice Problems
            </h2>
          </div>

          {problems && problems.length > 0 ? (
            <div className="divide-y divide-border-default">
              {problems.map((problem: any) => {
                const tags = problem.practice_problem_tags?.map((pt: any) => pt.practice_tags).filter(Boolean) ?? [];
                const stats = countMap[problem.id] ?? { participant_count: 0, valid_submission_count: 0 };
                const metricInfo = SCORING_METRIC_INFO[problem.scoring_metric as keyof typeof SCORING_METRIC_INFO];
                const diffInfo = problem.difficulty ? PRACTICE_DIFFICULTY_INFO[problem.difficulty as keyof typeof PRACTICE_DIFFICULTY_INFO] : null;

                return (
                  <div key={problem.id} className="p-6 hover:bg-bg-tertiary/50 transition-colors">
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3 flex-wrap">
                          <h3 className="text-xl font-bold">{problem.title}</h3>
                          {diffInfo && (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${diffInfo.bgColor} ${diffInfo.color}`}>
                              {diffInfo.label}
                            </span>
                          )}
                          {tags.map((tag: any) => (
                            <Badge key={tag.id} variant="tech">{tag.name}</Badge>
                          ))}
                        </div>

                        <p className="text-text-secondary text-sm mb-4 line-clamp-2">{problem.description}</p>

                        <div className="flex flex-wrap gap-6 text-sm">
                          <span className="text-text-secondary">
                            <strong className="text-text-primary">{stats.participant_count}</strong> participants
                          </span>
                          <span className="text-text-secondary">
                            <strong className="text-text-primary">{stats.valid_submission_count}</strong> valid submissions
                          </span>
                          <span className="text-text-secondary">
                            Metric: <strong className="text-text-primary">{metricInfo?.name ?? problem.scoring_metric}</strong>
                          </span>
                          <span className="text-text-secondary">
                            Daily limit: <strong className="text-text-primary">{problem.daily_submission_limit}</strong>
                          </span>
                          <span className="text-text-tertiary text-xs">
                            Created {new Date(problem.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <Link href={`/admin/practice/${problem.id}/edit`}>
                          <Button variant="outline" size="sm" className="w-full">
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                        </Link>
                        <Link href={`/practice/${problem.id}`}>
                          <Button variant="outline" size="sm" className="w-full">
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                        </Link>
                        <DeletePracticeProblemButton problemId={problem.id} problemTitle={problem.title} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center text-text-tertiary">
              <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No practice problems yet</p>
              <p className="text-sm mb-6">Create your first practice problem to get started</p>
              <Link href="/admin/practice/create">
                <Button variant="primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Practice Problem
                </Button>
              </Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
