import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import {
  Trophy,
  Users,
  Target,
  Calendar,
  Plus,
  Edit2,
  Eye,
  Search,
  Filter,
} from 'lucide-react';

export default async function AdminCompetitionsPage() {
  const supabase = await createClient();

  // Check authentication and admin role
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = (await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()) as { data: { role: string } | null };

  if (profile?.role !== 'admin') {
    redirect('/dashboard');
  }

  // Fetch all competitions with stats
  const { data: competitions } = (await supabase
    .from('competitions')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })) as { data: any };

  // Fetch registration counts for each competition
  const { data: registrationsData } = (await supabase
    .from('registrations')
    .select('competition_id, status')) as { data: any };

  // Fetch submission counts for each competition
  const { data: submissionsData } = (await supabase
    .from('submissions')
    .select('competition_id')) as { data: any };

  // Process counts
  const registrationCounts: Record<string, { approved: number; pending: number; total: number }> = {};
  registrationsData?.forEach((reg: any) => {
    if (!registrationCounts[reg.competition_id]) {
      registrationCounts[reg.competition_id] = { approved: 0, pending: 0, total: 0 };
    }
    registrationCounts[reg.competition_id].total++;
    if (reg.status === 'approved') {
      registrationCounts[reg.competition_id].approved++;
    } else if (reg.status === 'pending') {
      registrationCounts[reg.competition_id].pending++;
    }
  });

  const submissionCounts: Record<string, number> = {};
  submissionsData?.forEach((sub: any) => {
    submissionCounts[sub.competition_id] = (submissionCounts[sub.competition_id] || 0) + 1;
  });

  // Calculate current phase for each competition
  const getPhase = (comp: any) => {
    const now = new Date();
    const regStart = new Date(comp.registration_start);
    const regEnd = new Date(comp.registration_end);
    const publicEnd = new Date(comp.public_test_end);
    const privateEnd = comp.private_test_end ? new Date(comp.private_test_end) : null;

    if (now < regStart) return 'upcoming';
    if (now < regEnd) return 'registration';
    if (now < publicEnd) return 'public_test';
    if (privateEnd && now < privateEnd) return 'private_test';
    return 'ended';
  };

  const getPhaseVariant = (phase: string) => {
    switch (phase) {
      case 'upcoming':
        return 'secondary';
      case 'registration':
        return 'registration';
      case 'public_test':
        return 'public';
      case 'private_test':
        return 'private';
      case 'ended':
        return 'ended';
      default:
        return 'outline';
    }
  };

  const competitionsWithStats = competitions?.map((comp: any) => ({
    ...comp,
    phase: getPhase(comp),
    registrationCount: registrationCounts[comp.id] || { approved: 0, pending: 0, total: 0 },
    submissionCount: submissionCounts[comp.id] || 0,
  }));

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-4xl sm:text-5xl mb-2 gradient-text">
              Manage Competitions
            </h1>
            <p className="text-text-secondary">
              View and manage all competitions on the platform
            </p>
          </div>
          <Link href="/admin/competitions/create">
            <Button variant="primary" size="lg">
              <Plus className="w-5 h-5 mr-2" />
              Create New
            </Button>
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 border-l-4 border-primary-blue">
            <div className="flex items-center justify-between mb-2">
              <div className="text-text-tertiary text-sm">Total Competitions</div>
              <Trophy className="w-5 h-5 text-primary-blue" />
            </div>
            <div className="text-3xl font-bold text-primary-blue">
              {competitions?.length || 0}
            </div>
          </Card>

          <Card className="p-6 border-l-4 border-success">
            <div className="flex items-center justify-between mb-2">
              <div className="text-text-tertiary text-sm">Active Now</div>
              <Calendar className="w-5 h-5 text-success" />
            </div>
            <div className="text-3xl font-bold text-success">
              {competitionsWithStats?.filter((c: any) => c.phase === 'public_test' || c.phase === 'private_test').length || 0}
            </div>
          </Card>

          <Card className="p-6 border-l-4 border-warning">
            <div className="flex items-center justify-between mb-2">
              <div className="text-text-tertiary text-sm">Registration Open</div>
              <Users className="w-5 h-5 text-warning" />
            </div>
            <div className="text-3xl font-bold text-warning">
              {competitionsWithStats?.filter((c: any) => c.phase === 'registration').length || 0}
            </div>
          </Card>

          <Card className="p-6 border-l-4 border-accent-cyan">
            <div className="flex items-center justify-between mb-2">
              <div className="text-text-tertiary text-sm">Total Submissions</div>
              <Target className="w-5 h-5 text-accent-cyan" />
            </div>
            <div className="text-3xl font-bold text-accent-cyan">
              {Object.values(submissionCounts).reduce((a, b) => a + b, 0)}
            </div>
          </Card>
        </div>

        {/* Competitions List */}
        <Card className="overflow-hidden">
          <div className="p-6 border-b border-border-default bg-bg-tertiary">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Filter className="w-5 h-5" />
              All Competitions
            </h2>
          </div>

          {competitionsWithStats && competitionsWithStats.length > 0 ? (
            <div className="divide-y divide-border-default">
              {competitionsWithStats.map((competition: any) => (
                <div key={competition.id} className="p-6 hover:bg-bg-tertiary/50 transition-colors">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1 min-w-0">
                      {/* Title & Badges */}
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <h3 className="text-xl font-bold">{competition.title}</h3>
                        <Badge variant={getPhaseVariant(competition.phase)}>
                          {competition.phase.replace('_', ' ')}
                        </Badge>
                        <Badge variant="tech">{competition.participation_type}</Badge>
                        {competition.competition_type === '4phase' && (
                          <Badge variant="outline">4-Phase</Badge>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-text-secondary text-sm mb-4 line-clamp-2">
                        {competition.description}
                      </p>

                      {/* Stats */}
                      <div className="flex flex-wrap gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-text-tertiary" />
                          <span className="text-text-secondary">
                            <strong className="text-text-primary">
                              {competition.registrationCount.approved}
                            </strong>{' '}
                            approved
                          </span>
                          {competition.registrationCount.pending > 0 && (
                            <Badge variant="yellow" className="ml-1">
                              {competition.registrationCount.pending} pending
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-text-tertiary" />
                          <span className="text-text-secondary">
                            <strong className="text-text-primary">
                              {competition.submissionCount}
                            </strong>{' '}
                            submissions
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-text-tertiary" />
                          <span className="text-text-secondary">
                            Created {new Date(competition.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-text-tertiary" />
                          <span className="text-text-secondary">{competition.scoring_metric}</span>
                        </div>
                      </div>

                      {/* Timeline */}
                      <div className="mt-3 text-xs text-text-tertiary">
                        Registration:{' '}
                        {new Date(competition.registration_start).toLocaleDateString()} -{' '}
                        {new Date(competition.registration_end).toLocaleDateString()} | Public
                        Test ends: {new Date(competition.public_test_end).toLocaleDateString()}
                        {competition.private_test_end &&
                          ` | Private Test ends: ${new Date(competition.private_test_end).toLocaleDateString()}`}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <Link href={`/admin/competitions/${competition.id}/edit`}>
                        <Button variant="outline" size="sm" className="w-full">
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                      </Link>
                      <Link href={`/competitions/${competition.id}`}>
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-text-tertiary">
              <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No competitions yet</p>
              <p className="text-sm mb-6">Create your first competition to get started</p>
              <Link href="/admin/competitions/create">
                <Button variant="primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Competition
                </Button>
              </Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
