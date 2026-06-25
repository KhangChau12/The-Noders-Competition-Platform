import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { StatCard } from '@/components/admin/StatCard';
import Link from 'next/link';
import DeletePracticeProblemButton from './DeletePracticeProblemButton';
import { BookOpen, Plus, Edit2, Eye, Tag, Target, Users } from 'lucide-react';
import { SCORING_METRIC_INFO, PRACTICE_DIFFICULTY_INFO } from '@/lib/constants';

export const metadata = { title: 'Manage Practice Problems' };

export default async function AdminPracticePage() {
  const supabase = await createClient();

  // Auth + role already enforced by the admin layout.

  // Fetch problems with tag info
  const { data: problems } = await (supabase as any)
    .from('practice_problems')
    .select(
      'id, title, description, scoring_metric, difficulty, daily_submission_limit, created_at, practice_problem_tags(tag_id, practice_tags(id, name, slug))'
    )
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  // Fetch submission counts
  const { data: counts } = await (supabase as any)
    .from('practice_problem_submission_counts')
    .select('problem_id, participant_count, valid_submission_count');

  const countMap: Record<string, { participant_count: number; valid_submission_count: number }> = {};
  counts?.forEach((c: any) => { countMap[c.problem_id] = c; });

  const totalParticipants = Object.values(countMap).reduce((sum, c) => sum + (c.participant_count ?? 0), 0);
  const totalValidSubmissions = Object.values(countMap).reduce((sum, c) => sum + (c.valid_submission_count ?? 0), 0);

  return (
    <>
      <AdminPageHeader
        title="Practice Problems"
        description="Manage permanent practice problems for participants"
        action={
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/admin/practice/tags">
              <Button variant="outline" className="w-full sm:w-auto">
                <Tag className="w-4 h-4 mr-2" />
                Manage Tags
              </Button>
            </Link>
            <Link href="/admin/practice/create">
              <Button variant="primary" className="w-full sm:w-auto">
                <Plus className="w-5 h-5 mr-2" />
                Create New
              </Button>
            </Link>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8 sm:mb-10">
        <StatCard Icon={BookOpen} value={problems?.length ?? 0} label="Problems" sub="Published" accent="text-primary-blue/15" />
        <StatCard Icon={Users} value={totalParticipants} label="Participants" sub="Total solvers" accent="text-success/15" />
        <StatCard Icon={Target} value={totalValidSubmissions} label="Submissions" sub="Valid only" accent="text-accent-cyan/15" />
      </div>

        {/* Problems List */}
        <Card className="hover:translate-y-0 hover:border-border-default overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-border-default bg-bg-elevated">
            <h2 className="text-base sm:text-xl font-bold">
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
                  <div key={problem.id} className="p-4 sm:p-6 hover:bg-bg-elevated/50 transition-colors">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 lg:gap-6">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2.5 sm:mb-3 flex-wrap">
                          <h3 className="text-base sm:text-lg lg:text-xl font-bold break-words">{problem.title}</h3>
                          {diffInfo && (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${diffInfo.bgColor} ${diffInfo.color}`}>
                              {diffInfo.label}
                            </span>
                          )}
                          {tags.map((tag: any) => (
                            <Badge key={tag.id} variant="tech">{tag.name}</Badge>
                          ))}
                        </div>

                        <p className="text-text-secondary text-sm mb-3 sm:mb-4 line-clamp-2">{problem.description}</p>

                        <div className="flex flex-wrap gap-x-4 gap-y-1.5 sm:gap-x-6 text-xs sm:text-sm">
                          <span className="text-text-secondary">
                            <strong className="text-text-primary">{stats.participant_count}</strong> participants
                          </span>
                          <span className="text-text-secondary">
                            <strong className="text-text-primary">{stats.valid_submission_count}</strong> valid subs
                          </span>
                          <span className="text-text-secondary">
                            Metric: <strong className="text-text-primary">{metricInfo?.name ?? problem.scoring_metric}</strong>
                          </span>
                          <span className="text-text-secondary">
                            Daily: <strong className="text-text-primary">{problem.daily_submission_limit}</strong>
                          </span>
                          <span className="hidden sm:inline text-text-tertiary">
                            Created {new Date(problem.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-col gap-2 shrink-0 lg:w-44">
                        <Link href={`/admin/practice/${problem.id}/edit`} className="contents">
                          <Button variant="outline" size="sm" className="w-full">
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                        </Link>
                        <Link href={`/practice/${problem.id}`} className="contents">
                          <Button variant="outline" size="sm" className="w-full">
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                        </Link>
                        <div className="col-span-2 sm:col-span-1">
                          <DeletePracticeProblemButton problemId={problem.id} problemTitle={problem.title} />
                        </div>
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
    </>
  );
}
