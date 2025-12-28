import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { Clock, TrendingUp } from 'lucide-react';
import TeamsSidebar from './TeamsSidebar';

type CompetitionPhase = 'upcoming' | 'registration' | 'public_test' | 'private_test' | 'ended';

type Competition = {
  id: string;
  title: string;
  description: string;
  competition_type: '3-phase' | '4-phase';
  participation_type: 'individual' | 'team';
  registration_start: string;
  registration_end: string;
  public_test_start: string;
  public_test_end: string;
  private_test_start: string | null;
  private_test_end: string | null;
  scoring_metric: string;
};

type CompetitionWithStats = Competition & {
  phase: CompetitionPhase;
  participant_count: number;
  registration_status?: 'not_registered' | 'pending' | 'approved' | 'rejected';
  countdown?: {
    days: number;
    hours: number;
    minutes: number;
    label: string;
  };
};

// Helper function to determine competition phase
function getCompetitionPhase(comp: Competition, now: Date): CompetitionPhase {
  const regStart = new Date(comp.registration_start);
  const regEnd = new Date(comp.registration_end);
  const publicStart = new Date(comp.public_test_start);
  const publicEnd = new Date(comp.public_test_end);
  const privateStart = comp.private_test_start ? new Date(comp.private_test_start) : null;
  const privateEnd = comp.private_test_end ? new Date(comp.private_test_end) : null;

  if (now < regStart) return 'upcoming';
  if (now >= regStart && now <= regEnd) return 'registration';
  if (now > regEnd && now <= publicEnd) return 'public_test';
  if (privateStart && privateEnd && now > publicEnd && now <= privateEnd) return 'private_test';
  return 'ended';
}

// Helper function to get countdown
function getCountdown(
  comp: Competition,
  phase: CompetitionPhase,
  now: Date
): { days: number; hours: number; minutes: number; label: string } | undefined {
  if (phase === 'ended') return undefined;

  let targetDate: Date;
  let label: string;

  if (phase === 'upcoming') {
    targetDate = new Date(comp.registration_start);
    label = 'Registration starts in';
  } else if (phase === 'registration') {
    targetDate = new Date(comp.registration_end);
    label = 'Registration ends in';
  } else if (phase === 'public_test') {
    targetDate = new Date(comp.public_test_end);
    label = 'Public test ends in';
  } else if (phase === 'private_test' && comp.private_test_end) {
    targetDate = new Date(comp.private_test_end);
    label = 'Private test ends in';
  } else {
    return undefined;
  }

  const diff = targetDate.getTime() - now.getTime();
  if (diff < 0) return undefined;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return { days, hours, minutes, label };
}

export default async function DashboardPage() {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user's individual registrations
  const { data: individualRegistrations } = await supabase
    .from('registrations')
    .select(`
      id,
      competition_id,
      status,
      registered_at,
      competitions!inner (
        id,
        title,
        description,
        competition_type,
        participation_type,
        registration_start,
        registration_end,
        public_test_start,
        public_test_end,
        private_test_start,
        private_test_end,
        scoring_metric
      )
    `)
    .eq('user_id', user.id)
    .order('registered_at', { ascending: false });

  // Fetch user's team memberships first
  const { data: userTeamMemberships } = (await supabase
    .from('team_members')
    .select('team_id')
    .eq('user_id', user.id)) as { data: any };

  // Fetch team registrations if user is in any teams
  let teamRegistrations: any[] = [];
  if (userTeamMemberships && userTeamMemberships.length > 0) {
    const teamIds = userTeamMemberships.map((m: any) => m.team_id);

    const { data: teamRegs } = await supabase
      .from('registrations')
      .select(`
        id,
        competition_id,
        status,
        registered_at,
        team_id,
        competitions!inner (
          id,
          title,
          description,
          competition_type,
          participation_type,
          registration_start,
          registration_end,
          public_test_start,
          public_test_end,
          private_test_start,
          private_test_end,
          scoring_metric
        )
      `)
      .in('team_id', teamIds)
      .order('registered_at', { ascending: false });

    teamRegistrations = teamRegs || [];
  }

  // Combine individual and team registrations
  const registrations = [...(individualRegistrations || []), ...teamRegistrations];

  // Separate competitions
  const pendingCompetitions = registrations?.filter((r: any) => r.status === 'pending');

  // Fetch ALL active competitions
  const { data: allCompetitions } = (await supabase
    .from('competitions')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })) as { data: any };

  // Create map of competition_id -> registration status
  const registrationStatusMap = new Map(
    registrations?.map((r: any) => [r.competition_id, r.status]) || []
  );

  const now = new Date();

  // Fetch participant counts
  const { data: participantCountsData } = await supabase
    .from('competition_participant_counts')
    .select('competition_id, participant_count');

  const participantCounts = (participantCountsData || []).reduce(
    (acc, item: any) => {
      acc[item.competition_id] = item.participant_count;
      return acc;
    },
    {} as Record<string, number>
  );

  // Process ALL competitions
  const processAllCompetitions = (comps: any[]): CompetitionWithStats[] => {
    return comps.map((comp: Competition) => {
      const phase = getCompetitionPhase(comp, now);
      const countdown = getCountdown(comp, phase, now);
      const regStatus = registrationStatusMap.get(comp.id);
      const registration_status: 'not_registered' | 'pending' | 'approved' | 'rejected' =
        regStatus || 'not_registered';

      return {
        ...comp,
        phase,
        participant_count: participantCounts[comp.id] || 0,
        registration_status,
        countdown,
      };
    });
  };

  const processedAllCompetitions = allCompetitions
    ? processAllCompetitions(allCompetitions)
    : [];

  // Fetch user's teams
  const { data: teamMemberships } = (await supabase
    .from('team_members')
    .select(`
      *,
      teams (
        id,
        name,
        leader_id
      )
    `)
    .eq('user_id', user.id)) as { data: any };

  let userTeams: any[] = [];
  if (teamMemberships && teamMemberships.length > 0) {
    const teamIds = teamMemberships.map((m: any) => m.teams.id);

    const { data: memberCounts } = (await supabase
      .from('team_members')
      .select('team_id')
      .in('team_id', teamIds)) as { data: any };

    const countMap = new Map<string, number>();
    if (memberCounts) {
      memberCounts.forEach((row: any) => {
        countMap.set(row.team_id, (countMap.get(row.team_id) || 0) + 1);
      });
    }

    userTeams = teamMemberships.map((membership: any) => ({
      id: membership.teams.id,
      name: membership.teams.name,
      member_count: countMap.get(membership.teams.id) || 0,
      is_leader: membership.teams.leader_id === user.id,
    }));
  }

  // Fetch pending team invitations
  const { data: invitations } = (await supabase
    .from('team_invitations')
    .select(`
      *,
      teams (
        id,
        name
      ),
      invited_by_user:users!team_invitations_invited_by_fkey (
        id,
        full_name,
        email
      )
    `)
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .order('invited_at', { ascending: false })) as { data: any };

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-brand text-4xl md:text-5xl mb-2 gradient-text">Dashboard</h1>
          <p className="text-lg text-text-secondary">Welcome back! Here's your competition overview.</p>
        </div>

        {/* 2-Column Layout */}
        <div className="grid lg:grid-cols-[1fr_400px] gap-8">
          {/* LEFT COLUMN - Competitions */}
          <div>
            {/* Pending Approvals */}
            {pendingCompetitions && pendingCompetitions.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Clock className="w-6 h-6 text-warning" />
                  Pending Approvals
                </h2>

                <div className="space-y-4">
                  {pendingCompetitions.map((registration: any) => {
                    const comp = registration.competitions;
                    if (!comp) return null;

                    return (
                      <Card
                        key={registration.id}
                        className="p-6 border-l-4 border-warning bg-warning/5"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-bold">{comp.title}</h3>
                              <Badge variant="yellow">Pending</Badge>
                            </div>
                            <p className="text-text-secondary text-sm">
                              Your registration is being reviewed by administrators.
                            </p>
                          </div>
                          <Link href={`/competitions/${comp.id}`}>
                            <Button variant="outline" size="sm">
                              View Competition
                            </Button>
                          </Link>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}

            {/* All Competitions */}
            {processedAllCompetitions.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-primary-blue" />
                    All Competitions
                  </h2>
                  <Link href="/competitions">
                    <Button variant="outline" size="sm">
                      Browse All
                    </Button>
                  </Link>
                </div>

                <div className="space-y-4">
                  {processedAllCompetitions.map((competition) => {
                    const now = new Date();
                    const regStart = new Date(competition.registration_start);
                    const regEnd = new Date(competition.registration_end);
                    const publicEnd = new Date(competition.public_test_end);
                    const privateEnd = competition.private_test_end ? new Date(competition.private_test_end) : null;

                    const totalDuration = (privateEnd || publicEnd).getTime() - regStart.getTime();
                    const elapsed = now.getTime() - regStart.getTime();
                    const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));

                    return (
                      <Link key={competition.id} href={`/competitions/${competition.id}`} className="block">
                        <Card className="p-6 hover:border-primary-blue/50 transition-all cursor-pointer">
                          <div className="mb-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h3 className="text-xl font-semibold mb-1">
                                  {competition.title}
                                </h3>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge
                                    variant={
                                      competition.phase === 'registration' ? 'purple' :
                                      competition.phase === 'public_test' ? 'blue' :
                                      competition.phase === 'private_test' ? 'cyan' : 'gray'
                                    }
                                  >
                                    {competition.phase === 'registration' ? 'Registration' :
                                     competition.phase === 'public_test' ? 'Public Test' :
                                     competition.phase === 'private_test' ? 'Private Test' : 'Ended'}
                                  </Badge>

                                  {competition.phase !== 'ended' && (
                                    <Badge
                                      variant={
                                        competition.registration_status === 'approved' ? 'green' :
                                        competition.registration_status === 'pending' ? 'yellow' :
                                        competition.registration_status === 'rejected' ? 'red' : 'gray'
                                      }
                                    >
                                      {competition.registration_status === 'approved' ? '✓ Registered' :
                                       competition.registration_status === 'pending' ? '⏳ Pending' :
                                       competition.registration_status === 'rejected' ? '✗ Rejected' : 'Not Registered'}
                                    </Badge>
                                  )}

                                  {competition.countdown && (
                                    <span className="text-sm text-text-secondary">
                                      {competition.countdown.label}: {competition.countdown.days}d {competition.countdown.hours}h {competition.countdown.minutes}m
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Timeline Bar */}
                          <div className="relative">
                            <div className="relative h-3 bg-bg-elevated rounded-full overflow-hidden">
                              <div
                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-blue to-accent-cyan rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                              />
                            </div>

                            <div className="flex justify-between mt-3 text-xs">
                              <div className="flex flex-col items-start">
                                <span className="text-text-tertiary mb-1">Registration</span>
                                <span className="text-text-secondary font-semibold">
                                  {regStart.toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex flex-col items-end">
                                <span className="text-text-tertiary mb-1">End</span>
                                <span className="text-text-secondary font-semibold">
                                  {(privateEnd || publicEnd).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR - Teams */}
          <aside className="lg:sticky lg:top-8 lg:self-start">
            <TeamsSidebar userTeams={userTeams} invitations={invitations || []} />
          </aside>
        </div>
      </div>
    </div>
  );
}
