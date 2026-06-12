'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import {
  Search,
  SortAsc,
  Trophy,
  Clock,
  Loader2,
  ArrowRight,
  Crown,
} from 'lucide-react';
import { SCORING_METRIC_INFO } from '@/lib/constants';

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
  created_at: string;
};

type CompetitionWithStats = Competition & {
  phase: CompetitionPhase;
  participant_count: number;
  team_count: number;
  submission_count: number;
  leader: { name: string; score: number } | null;
  registration_status?: 'not_registered' | 'pending' | 'approved' | 'rejected';
  countdown?: {
    days: number;
    hours: number;
    minutes: number;
    label: string;
  };
};

type FilterStatus = 'all' | 'registration' | 'ongoing' | 'ended';
type SortOption = 'latest' | 'ending_soon' | 'most_participants';

export default function CompetitionsPage() {
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [competitions, setCompetitions] = useState<CompetitionWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Filter and sort states
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>(
    (searchParams.get('status') as FilterStatus) || 'all'
  );
  const [sortBy, setSortBy] = useState<SortOption>(
    (searchParams.get('sort') as SortOption) || 'latest'
  );

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, [supabase.auth]);

  // Fetch competitions
  useEffect(() => {
    const fetchCompetitions = async () => {
      setLoading(true);
      try {
        // Fetch competitions
        const { data: competitionsData, error: competitionsError } = await supabase
          .from('competitions')
          .select('*')
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        if (competitionsError) throw competitionsError;

        if (!competitionsData) {
          setCompetitions([]);
          setLoading(false);
          return;
        }

        // Fetch participant counts from public view (bypasses RLS)
        const { data: participantCountsData } = await supabase
          .from('competition_participant_counts')
          .select('competition_id, participant_count');

        // Fetch submission counts
        const { data: submissionsData } = await supabase
          .from('submissions')
          .select('competition_id');

        // Fetch best valid scores (with names) to surface the current leader / winner per competition
        const { data: bestScoresData } = await supabase
          .from('submissions')
          .select(
            'competition_id, score, phase, user_id, team_id, users!submissions_user_id_fkey(full_name), teams!submissions_team_id_fkey(name)'
          )
          .eq('is_best_score', true)
          .eq('validation_status', 'valid')
          .not('score', 'is', null);

        // Fetch team registration counts (for team competitions)
        const { data: teamRegistrationsData } = await supabase
          .from('registrations')
          .select('competition_id, team_id, status')
          .not('team_id', 'is', null)
          .eq('status', 'approved');

        // Map participant counts
        const participantCounts = (participantCountsData || []).reduce(
          (acc, item: any) => {
            acc[item.competition_id] = item.participant_count;
            return acc;
          },
          {} as Record<string, number>
        );

        // Map submission counts
        const submissionCounts = (submissionsData || []).reduce(
          (acc, item: any) => {
            acc[item.competition_id] = (acc[item.competition_id] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );

        // Group best scores by competition
        const bestByComp: Record<string, any[]> = {};
        (bestScoresData || []).forEach((row: any) => {
          (bestByComp[row.competition_id] ??= []).push(row);
        });

        // Map team counts
        const teamCounts = (teamRegistrationsData || []).reduce(
          (acc, item: any) => {
            acc[item.competition_id] = (acc[item.competition_id] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );

        // Fetch user's registration statuses if logged in
        let userRegistrations: Record<string, string> = {};
        if (userId) {
          // Fetch individual registrations
          const { data: individualRegsData } = await supabase
            .from('registrations')
            .select('competition_id, status')
            .eq('user_id', userId);

          // Fetch team registrations
          const { data: teamMemberships } = await supabase
            .from('team_members')
            .select('team_id')
            .eq('user_id', userId);

          let teamRegsData: any[] = [];
          if (teamMemberships && teamMemberships.length > 0) {
            const teamIds = teamMemberships.map((m: any) => m.team_id);
            const { data: teamRegs } = await supabase
              .from('registrations')
              .select('competition_id, status')
              .in('team_id', teamIds);

            teamRegsData = teamRegs || [];
          }

          // Combine individual and team registrations
          const allRegsData = [...(individualRegsData || []), ...teamRegsData];

          userRegistrations = allRegsData.reduce(
            (acc, reg: any) => {
              acc[reg.competition_id] = reg.status;
              return acc;
            },
            {} as Record<string, string>
          );
        }

        // Process competitions with phase and stats
        const now = new Date();
        const processedCompetitions: CompetitionWithStats[] = competitionsData.map((comp: any) => {
          const phase = getCompetitionPhase(comp, now);
          const countdown = getCountdown(comp, phase, now);

          return {
            ...comp,
            phase,
            participant_count: participantCounts[comp.id] || 0,
            team_count: teamCounts[comp.id] || 0,
            submission_count: submissionCounts[comp.id] || 0,
            leader: getLeader(comp, phase, bestByComp[comp.id] || []),
            registration_status: userId
              ? (userRegistrations[comp.id] as any) || 'not_registered'
              : undefined,
            countdown,
          };
        });

        setCompetitions(processedCompetitions);
      } catch (error) {
        console.error('Error fetching competitions:', error);
        setCompetitions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCompetitions();
  }, [supabase, userId]);

  const isFiltering = Boolean(searchQuery.trim()) || filterStatus !== 'all';

  // Spotlight: the most urgent competition currently open (or soon opening) for registration.
  // Hidden while the user is actively filtering/searching.
  const spotlight = useMemo(() => {
    if (isFiltering) return null;
    const open = competitions
      .filter((c) => c.phase === 'registration')
      .sort(
        (a, b) =>
          new Date(a.registration_end).getTime() - new Date(b.registration_end).getTime()
      );
    if (open.length > 0) return open[0];
    const upcoming = competitions
      .filter((c) => c.phase === 'upcoming')
      .sort(
        (a, b) =>
          new Date(a.registration_start).getTime() - new Date(b.registration_start).getTime()
      );
    return upcoming[0] ?? null;
  }, [competitions, isFiltering]);

  // Filter and sort competitions
  const filteredAndSortedCompetitions = useMemo(() => {
    let filtered = competitions;

    if (spotlight) {
      filtered = filtered.filter((comp) => comp.id !== spotlight.id);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((comp) =>
        comp.title.toLowerCase().includes(query) ||
        comp.description.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter((comp) => {
        if (filterStatus === 'registration') return comp.phase === 'registration';
        if (filterStatus === 'ongoing')
          return comp.phase === 'public_test' || comp.phase === 'private_test';
        if (filterStatus === 'ended') return comp.phase === 'ended';
        return true;
      });
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'latest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === 'ending_soon') {
        const aEnd = getPhaseEndDate(a);
        const bEnd = getPhaseEndDate(b);
        if (!aEnd && !bEnd) return 0;
        if (!aEnd) return 1;
        if (!bEnd) return -1;
        return new Date(aEnd).getTime() - new Date(bEnd).getTime();
      }
      if (sortBy === 'most_participants') {
        return b.participant_count - a.participant_count;
      }
      return 0;
    });

    return sorted;
  }, [competitions, searchQuery, filterStatus, sortBy, spotlight]);

  // Live vs past split (only used when not filtering)
  const liveCompetitions = useMemo(
    () => filteredAndSortedCompetitions.filter((c) => c.phase !== 'ended'),
    [filteredAndSortedCompetitions]
  );
  const pastCompetitions = useMemo(
    () => filteredAndSortedCompetitions.filter((c) => c.phase === 'ended'),
    [filteredAndSortedCompetitions]
  );

  // Header stats
  const stats = useMemo(() => {
    const active = competitions.filter((c) => c.phase !== 'ended').length;
    const participants = competitions.reduce((sum, c) => sum + c.participant_count, 0);
    const submissions = competitions.reduce((sum, c) => sum + c.submission_count, 0);
    return { active, participants, submissions };
  }, [competitions]);

  return (
    <div className="min-h-screen px-4 sm:px-6 py-8 sm:py-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="relative mb-6 sm:mb-10 overflow-hidden">
          <Trophy className="absolute -top-4 -right-6 h-32 w-32 text-primary-blue/10 rotate-[10deg] pointer-events-none hidden sm:block [filter:drop-shadow(0_0_20px_rgba(37,99,235,0.25))]" />
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-cyan mb-2">
            Compete · Learn · Win
          </p>
          <h1 className="font-brand text-3xl sm:text-4xl md:text-5xl gradient-text leading-tight mb-3">
            Competitions
          </h1>
          <p className="text-sm sm:text-lg text-text-secondary max-w-2xl mb-3 sm:mb-4">
            Browse active competitions and start your AI journey
          </p>
          {!loading && competitions.length > 0 && (
            <p className="text-xs font-mono uppercase tracking-wide text-text-tertiary">
              {stats.active} active
              {' · '}{stats.participants} participant{stats.participants !== 1 ? 's' : ''}
              {' · '}{stats.submissions} submission{stats.submissions !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Toolbar: search row, then status + sort sharing one row on phones */}
        <div className="flex flex-col lg:flex-row gap-2.5 sm:gap-3 mb-6 sm:mb-8 lg:items-center">
          <div className="relative flex-1 lg:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-tertiary" />
            <Input
              type="text"
              placeholder="Search competitions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4"
            />
          </div>

          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Status segmented control */}
            <div className="flex flex-1 sm:flex-none rounded-lg border border-border-default bg-bg-surface p-1 overflow-x-auto scrollbar-none min-w-0">
              {[
                { value: 'all', label: 'All' },
                { value: 'registration', label: 'Registering' },
                { value: 'ongoing', label: 'Ongoing' },
                { value: 'ended', label: 'Ended' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFilterStatus(option.value as FilterStatus)}
                  className={`flex-1 sm:flex-none px-2 sm:px-3 py-2 sm:py-1.5 rounded-md text-[13px] sm:text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
                    filterStatus === option.value
                      ? 'bg-primary-blue text-white'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2 shrink-0">
              <SortAsc className="hidden sm:block h-4 w-4 text-text-tertiary" aria-hidden="true" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-2 sm:px-3 py-2.5 sm:py-2 max-w-[110px] sm:max-w-none bg-bg-surface border border-border-default rounded-lg text-[13px] sm:text-sm focus:outline-none focus:ring-2 focus:ring-border-focus"
                aria-label="Sort competitions"
              >
                <option value="latest">Latest</option>
                <option value="ending_soon">Ending Soon</option>
                <option value="most_participants">Most Participants</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary-blue" />
          </div>
        )}

        {/* Spotlight */}
        {!loading && spotlight && (
          <SpotlightCard competition={spotlight} isLoggedIn={!!userId} />
        )}

        {/* Empty State */}
        {!loading && !spotlight && filteredAndSortedCompetitions.length === 0 && (
          <Card className="p-8 sm:p-12 text-center">
            <Trophy className="h-14 w-14 sm:h-16 sm:w-16 mx-auto mb-4 text-text-tertiary" />
            <h3 className="text-lg sm:text-xl font-bold text-text-primary mb-2">No competitions found</h3>
            <p className="text-text-secondary">
              {isFiltering
                ? 'Try adjusting your filters or search query'
                : 'Check back soon for new competitions'}
            </p>
          </Card>
        )}

        {/* Competitions Grid */}
        {!loading && filteredAndSortedCompetitions.length > 0 && (
          isFiltering ? (
            <CompetitionSection
              title="Results"
              competitions={filteredAndSortedCompetitions}
              isLoggedIn={!!userId}
            />
          ) : (
            <div className="space-y-8 sm:space-y-12">
              {liveCompetitions.length > 0 && (
                <CompetitionSection
                  kicker="Open · Running · Upcoming"
                  title={spotlight ? 'More Competitions' : 'Live & Upcoming'}
                  competitions={liveCompetitions}
                  isLoggedIn={!!userId}
                />
              )}
              {pastCompetitions.length > 0 && (
                <CompetitionSection
                  kicker="Archive"
                  title="Past Competitions"
                  competitions={pastCompetitions}
                  isLoggedIn={!!userId}
                />
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}

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

// Current leader (ongoing) or winner (ended) from best valid scores.
// Ended competitions prefer the private-test leaderboard when it has entries.
function getLeader(
  comp: Competition,
  phase: CompetitionPhase,
  rows: any[]
): { name: string; score: number } | null {
  if (rows.length === 0) return null;
  const privateRows = rows.filter((r) => r.phase === 'private');
  const pool =
    phase === 'ended' && privateRows.length > 0
      ? privateRows
      : rows.filter((r) => r.phase === 'public');
  if (pool.length === 0) return null;
  const higherIsBetter =
    SCORING_METRIC_INFO[comp.scoring_metric as keyof typeof SCORING_METRIC_INFO]
      ?.higher_is_better !== false;
  const best = [...pool].sort((a, b) =>
    higherIsBetter ? b.score - a.score : a.score - b.score
  )[0];
  const team = Array.isArray(best.teams) ? best.teams[0] : best.teams;
  const user = Array.isArray(best.users) ? best.users[0] : best.users;
  const name = team?.name ?? user?.full_name ?? 'Anonymous';
  return { name, score: best.score };
}

// Helper function to get phase end date for sorting
function getPhaseEndDate(comp: CompetitionWithStats): string | null {
  if (comp.phase === 'ended') return null;
  if (comp.phase === 'registration') return comp.registration_end;
  if (comp.phase === 'public_test') return comp.public_test_end;
  if (comp.phase === 'private_test') return comp.private_test_end;
  return null;
}

// Overall timeline progress (registration start -> final end), clamped to [0, 100]
function getTimelineProgress(comp: Competition): number {
  const start = new Date(comp.registration_start).getTime();
  const end = new Date(comp.private_test_end ?? comp.public_test_end).getTime();
  if (end <= start) return 0;
  const elapsed = Date.now() - start;
  return Math.min(100, Math.max(0, (elapsed / (end - start)) * 100));
}

const PHASE_CONFIG = {
  upcoming: { label: 'Coming Soon', variant: 'secondary' as const },
  registration: { label: 'Registration Open', variant: 'registration' as const },
  public_test: { label: 'Public Test', variant: 'public' as const },
  private_test: { label: 'Private Test', variant: 'private' as const },
  ended: { label: 'Ended', variant: 'ended' as const },
};

function RegistrationStatusBadge({
  competition,
  isLoggedIn,
}: {
  competition: CompetitionWithStats;
  isLoggedIn: boolean;
}) {
  if (!isLoggedIn || !competition.registration_status) return null;

  const statusConfig = {
    not_registered: null,
    pending: { label: 'Pending', variant: 'yellow' as const },
    approved: { label: 'Registered', variant: 'green' as const },
    rejected: { label: 'Rejected', variant: 'red' as const },
  };

  const config = statusConfig[competition.registration_status];
  if (!config) return null;

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

// Featured competition with a large countdown and CTA
function SpotlightCard({
  competition,
  isLoggedIn,
}: {
  competition: CompetitionWithStats;
  isLoggedIn: boolean;
}) {
  const phaseInfo = PHASE_CONFIG[competition.phase];
  const isOpen = competition.phase === 'registration';
  const notRegistered =
    !competition.registration_status || competition.registration_status === 'not_registered';

  return (
    <section className="mb-8 sm:mb-12">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-cyan mb-2.5 sm:mb-3 px-1">
        {isOpen ? 'Registration closing soon' : 'Up next'}
      </p>
      <Link href={`/competitions/${competition.id}`} className="group block">
        <Card className="relative overflow-hidden p-5 sm:p-8 bg-bg-surface ring-1 ring-primary-blue/35 shadow-glow-blue-sm hover:-translate-y-1 hover:shadow-lg">
          <Trophy className="absolute -bottom-8 -right-8 h-44 w-44 text-primary-blue/[0.07] rotate-[-12deg] pointer-events-none select-none [filter:drop-shadow(0_0_24px_rgba(37,99,235,0.35))]" />
          <div className="relative grid lg:grid-cols-[1fr_300px] gap-6 lg:gap-10 items-center">
            {/* Left: info */}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge variant={phaseInfo.variant}>{phaseInfo.label}</Badge>
                <Badge variant="tech">
                  {competition.scoring_metric.replace('_', ' ').toUpperCase()}
                </Badge>
                {competition.participation_type === 'team' && <Badge variant="outline">Team</Badge>}
                {competition.competition_type === '4-phase' && (
                  <Badge variant="outline">4-Phase</Badge>
                )}
                <RegistrationStatusBadge competition={competition} isLoggedIn={isLoggedIn} />
              </div>

              <h2 className="text-xl sm:text-3xl font-bold leading-snug text-text-primary mb-2 sm:mb-3 group-hover:text-primary-blue transition-colors">
                {competition.title}
              </h2>
              <p className="text-sm sm:text-base text-text-secondary leading-relaxed line-clamp-2 sm:line-clamp-3 mb-3 sm:mb-4">
                {competition.description}
              </p>

              <p className="text-xs font-mono uppercase tracking-wide text-text-tertiary">
                {competition.participant_count} participant{competition.participant_count !== 1 ? 's' : ''}
                {competition.participation_type === 'team' && competition.team_count > 0 && (
                  <> · {competition.team_count} team{competition.team_count !== 1 ? 's' : ''}</>
                )}
                {' · '}{competition.submission_count} submission{competition.submission_count !== 1 ? 's' : ''}
                {' · '}
                {new Date(competition.registration_start).toLocaleDateString()} –{' '}
                {new Date(
                  competition.private_test_end ?? competition.public_test_end
                ).toLocaleDateString()}
              </p>
            </div>

            {/* Right: countdown + CTA */}
            <div className="bg-bg-elevated/60 border border-border-subtle/50 rounded-xl p-4 sm:p-5 text-center">
              {competition.countdown ? (
                <>
                  <p className="text-xs font-mono uppercase tracking-wide text-text-tertiary mb-3 flex items-center justify-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-primary-blue" />
                    {competition.countdown.label.replace(' in', '')}
                  </p>
                  <div className="grid grid-cols-3 gap-2 mb-5">
                    {[
                      { value: competition.countdown.days, unit: 'Days' },
                      { value: competition.countdown.hours, unit: 'Hrs' },
                      { value: competition.countdown.minutes, unit: 'Min' },
                    ].map(({ value, unit }) => (
                      <div key={unit}>
                        <div className="text-2xl sm:text-3xl font-bold text-primary-blue font-mono">
                          {value}
                        </div>
                        <div className="text-[11px] uppercase tracking-wide text-text-tertiary">
                          {unit}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
              <Button variant="primary" className="w-full gap-2" size="md">
                {isOpen && notRegistered ? 'Register now' : 'View details'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </Link>
    </section>
  );
}

// Titled section wrapping a grid of competition cards
function CompetitionSection({
  kicker,
  title,
  competitions,
  isLoggedIn,
}: {
  kicker?: string;
  title: string;
  competitions: CompetitionWithStats[];
  isLoggedIn: boolean;
}) {
  return (
    <section className="space-y-4 sm:space-y-5">
      <div className="flex items-end justify-between gap-2 px-1">
        <div>
          {kicker && (
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-cyan mb-1">
              {kicker}
            </p>
          )}
          <h2 className="text-lg sm:text-xl font-bold">{title}</h2>
        </div>
        <p className="text-sm text-text-tertiary shrink-0">
          {competitions.length} competition{competitions.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {competitions.map((competition) => (
          <CompetitionGridCard
            key={competition.id}
            competition={competition}
            isLoggedIn={isLoggedIn}
          />
        ))}
      </div>
    </section>
  );
}

// Competition Card Component (marketplace-style grid)
function CompetitionGridCard({
  competition,
  isLoggedIn,
}: {
  competition: CompetitionWithStats;
  isLoggedIn: boolean;
}) {
  const phaseInfo = PHASE_CONFIG[competition.phase];
  const progress = getTimelineProgress(competition);
  const start = new Date(competition.registration_start);
  const end = new Date(competition.private_test_end ?? competition.public_test_end);
  const decimals =
    SCORING_METRIC_INFO[competition.scoring_metric as keyof typeof SCORING_METRIC_INFO]
      ?.decimals ?? 4;
  const showLeader =
    competition.leader &&
    (competition.phase === 'ended' ||
      competition.phase === 'public_test' ||
      competition.phase === 'private_test');

  return (
    <Link href={`/competitions/${competition.id}`} className="group block h-full">
      <Card
        className={`h-full p-4 sm:p-6 bg-bg-surface shadow-md transition-all duration-200 border-border-default hover:border-border-focus hover:-translate-y-1 hover:shadow-lg ${
          competition.phase === 'registration' ? 'ring-1 ring-primary-blue/35 shadow-glow-blue-sm' : ''
        }`}
      >
        <div className="h-full flex flex-col gap-3.5 sm:gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={phaseInfo.variant}>{phaseInfo.label}</Badge>
            <Badge variant="tech">{competition.scoring_metric.replace('_', ' ').toUpperCase()}</Badge>
            {competition.participation_type === 'team' && <Badge variant="outline">Team</Badge>}
            {competition.competition_type === '4-phase' && <Badge variant="outline">4-Phase</Badge>}
            <RegistrationStatusBadge competition={competition} isLoggedIn={isLoggedIn} />
          </div>

          <div>
            <h3 className="text-lg sm:text-xl font-bold leading-snug text-text-primary mb-2 line-clamp-2 group-hover:text-primary-blue transition-colors">
              {competition.title}
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed line-clamp-2">
              {competition.description}
            </p>
          </div>

          {/* Timeline */}
          <div>
            <div className="relative h-1.5 bg-bg-elevated rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-blue to-accent-cyan rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 mt-1.5 text-[11px] text-text-tertiary">
              <span className="order-1">{start.toLocaleDateString()}</span>
              {competition.countdown ? (
                // Drops to its own centered line on phones, sits between the dates on larger screens
                <span className="order-3 sm:order-2 w-full sm:w-auto flex items-center justify-center gap-1 text-text-secondary">
                  <Clock className="h-3 w-3 text-primary-blue" />
                  {competition.countdown.label.toLowerCase()}{' '}
                  <span className="font-mono font-semibold text-primary-blue">
                    {competition.countdown.days}d {competition.countdown.hours}h
                  </span>
                </span>
              ) : (
                <span className="order-2">{competition.phase === 'ended' ? 'Ended' : ''}</span>
              )}
              <span className="order-2 sm:order-3">{end.toLocaleDateString()}</span>
            </div>
          </div>

          {/* Leader / winner */}
          {showLeader && (
            <div className="flex items-center gap-2 text-xs rounded-lg border border-border-subtle/50 bg-bg-elevated/40 px-2.5 py-1.5 sm:px-3 sm:py-2">
              <Crown className="h-3.5 w-3.5 text-warning shrink-0" />
              <span className="font-mono uppercase tracking-wide text-text-tertiary shrink-0">
                {competition.phase === 'ended' ? 'Winner' : 'Leading'}
              </span>
              <span className="font-semibold text-text-primary truncate">
                {competition.leader!.name}
              </span>
              <span className="font-mono text-accent-cyan ml-auto shrink-0">
                {competition.leader!.score.toFixed(decimals)}
              </span>
            </div>
          )}

          <div className="mt-auto border-t border-border-subtle/60 pt-3 flex items-center justify-between gap-3 text-sm">
            <span className="text-xs font-mono uppercase tracking-wide text-text-tertiary truncate">
              {competition.participant_count} participant{competition.participant_count !== 1 ? 's' : ''}
              {competition.participation_type === 'team' && competition.team_count > 0 && (
                <> · {competition.team_count} team{competition.team_count !== 1 ? 's' : ''}</>
              )}
              {' · '}{competition.submission_count} subs
            </span>
            <span className="font-semibold text-primary-blue shrink-0 group-hover:translate-x-0.5 transition-transform">
              View &rarr;
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
