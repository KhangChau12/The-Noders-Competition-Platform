'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { StatRun } from '@/components/ui/StatRun';
import PhaseTimeline from '@/components/competition/PhaseTimeline';
import Link from 'next/link';
import { Search, ArrowRight, Crown } from 'lucide-react';
import {
  CompetitionCardSkeleton,
  SectionHeadingSkeleton,
} from '@/components/ui/PageSkeletons';
import { SCORING_METRIC_INFO, metricShortName, metricArrow } from '@/lib/constants';
import { getCompetitionPhase, getCountdown, type CompetitionPhase } from '@/lib/utils/competition';

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
          .select(
            'id, title, description, competition_type, participation_type, registration_start, registration_end, public_test_start, public_test_end, private_test_start, private_test_end, scoring_metric, created_at'
          )
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

        // Fetch submission counts (only competition_id needed for grouping)
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
          const countdown = getCountdown(comp, phase, now) ?? undefined;

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
        {/* Header — h1 + tertiary subtitle + a stat run */}
        <div className="mb-6 sm:mb-10">
          <h1 className="text-2xl font-bold tracking-[-0.01em] text-text-primary mb-1">
            Competitions
          </h1>
          <p className="text-sm text-text-tertiary mb-5">
            Active challenges and past results from the Noders PTNK community.
          </p>
          {!loading && competitions.length > 0 && (
            <StatRun
              items={[
                { label: 'Active', value: String(stats.active) },
                { label: 'Participants', value: stats.participants.toLocaleString() },
                { label: 'Submissions', value: stats.submissions.toLocaleString() },
                { label: 'Ended', value: String(competitions.length - stats.active) },
              ]}
            />
          )}
        </div>

        {/* Toolbar: bottom-border search + underline-link segmented controls */}
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 mb-6 sm:mb-8 lg:items-end">
          <div className="relative flex-1 lg:max-w-md">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search competitions…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full min-h-[44px] sm:min-h-0 bg-transparent border-0 border-b border-border-subtle pl-6 pr-2 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary-blue"
            />
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 min-w-0">
            <div className="flex gap-4 sm:gap-[18px] overflow-x-auto scrollbar-none">
              {[
                { value: 'all', label: 'All' },
                { value: 'registration', label: 'Registering' },
                { value: 'ongoing', label: 'Ongoing' },
                { value: 'ended', label: 'Ended' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFilterStatus(option.value as FilterStatus)}
                  className={`min-h-[44px] sm:min-h-0 shrink-0 border-b-2 py-1 text-xs font-bold uppercase tracking-[0.04em] whitespace-nowrap transition-colors ${
                    filterStatus === option.value
                      ? 'border-primary-blue text-text-primary'
                      : 'border-transparent text-text-tertiary hover:text-text-secondary'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="flex gap-4 sm:gap-[18px]">
              {[
                { value: 'latest', label: 'Latest' },
                { value: 'ending_soon', label: 'Ending soon' },
                { value: 'most_participants', label: 'Most people' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSortBy(option.value as SortOption)}
                  className={`min-h-[44px] sm:min-h-0 shrink-0 border-b-2 py-1 text-xs font-bold uppercase tracking-[0.04em] whitespace-nowrap transition-colors ${
                    sortBy === option.value
                      ? 'border-primary-blue text-text-primary'
                      : 'border-transparent text-text-tertiary hover:text-text-secondary'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading — the shape every outcome shares */}
        {loading && (
          <div className="space-y-4 sm:space-y-5">
            <SectionHeadingSkeleton />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
              {[0, 1, 2, 3].map((i) => (
                <CompetitionCardSkeleton key={i} />
              ))}
            </div>
          </div>
        )}

        {/* Spotlight */}
        {!loading && spotlight && (
          <SpotlightCard competition={spotlight} isLoggedIn={!!userId} />
        )}

        {/* Empty */}
        {!loading && !spotlight && filteredAndSortedCompetitions.length === 0 && (
          <div className="border-y border-border-subtle py-16 text-center">
            <h3 className="text-lg font-extrabold text-text-primary mb-2">No competitions found</h3>
            <p className="text-sm text-text-tertiary">
              {isFiltering
                ? 'Try adjusting your filters or search query.'
                : 'Check back soon for new competitions.'}
            </p>
          </div>
        )}

        {/* Grid */}
        {!loading && filteredAndSortedCompetitions.length > 0 && (
          isFiltering ? (
            <CompetitionSection
              title="Results"
              competitions={filteredAndSortedCompetitions}
              isLoggedIn={!!userId}
            />
          ) : (
            <div className="space-y-8 sm:space-y-10">
              {liveCompetitions.length > 0 && (
                <CompetitionSection
                  title={spotlight ? 'More Competitions' : 'Live & Upcoming'}
                  competitions={liveCompetitions}
                  isLoggedIn={!!userId}
                />
              )}
              {pastCompetitions.length > 0 && (
                <CompetitionSection
                  title="Past Competitions"
                  competitions={pastCompetitions}
                  isLoggedIn={!!userId}
                  past
                />
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
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

// Phase → coloured-word config. label is sentence-case; colour class drives the dot.
const PHASE_CONFIG: Record<
  CompetitionPhase,
  { label: string; tone: string }
> = {
  upcoming: { label: 'Coming soon', tone: 'text-text-tertiary' },
  registration: { label: 'Registration open', tone: 'text-[#A78BFA]' },
  public_test: { label: 'Public test', tone: 'text-[#60A5FA]' },
  private_test: { label: 'Private test', tone: 'text-[#22D3EE]' },
  ended: { label: 'Ended', tone: 'text-text-tertiary' },
};

// A coloured phase word with a leading dot — not a pill.
function PhaseWord({ phase }: { phase: CompetitionPhase }) {
  const { label, tone } = PHASE_CONFIG[phase];
  const glow = phase !== 'ended' && phase !== 'upcoming';
  return (
    <span className={`inline-flex items-center gap-[7px] font-bold ${tone}`}>
      <span
        className="w-[7px] h-[7px] rounded-full bg-current"
        style={glow ? { boxShadow: '0 0 0 3px color-mix(in srgb, currentColor 20%, transparent)' } : undefined}
      />
      {label}
    </span>
  );
}

// Registration status as a plain coloured "fact" word in the eyebrow.
function registrationFact(
  competition: CompetitionWithStats,
  isLoggedIn: boolean
): { label: string; className: string } | null {
  if (!isLoggedIn || !competition.registration_status) return null;
  switch (competition.registration_status) {
    case 'approved':
      return { label: 'Registered', className: 'text-[#22D3EE]' };
    case 'pending':
      return { label: 'Pending', className: 'text-[#FBBF24]' };
    case 'rejected':
      return { label: 'Rejected', className: 'text-[#F87171]' };
    default:
      return null;
  }
}


// Eyebrow row: phase word + sentence-case facts.
function CardEyebrow({
  competition,
  isLoggedIn,
}: {
  competition: CompetitionWithStats;
  isLoggedIn: boolean;
}) {
  const regFact = registrationFact(competition, isLoggedIn);
  return (
    <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2 text-xs">
      <PhaseWord phase={competition.phase} />
      <span className="font-semibold text-text-tertiary">
        {metricShortName(competition.scoring_metric)} {metricArrow(competition.scoring_metric)}
      </span>
      {(competition.participation_type === 'team' || competition.competition_type === '4-phase') && (
        <span className="font-semibold text-text-tertiary">
          {[
            competition.participation_type === 'team' ? 'Team' : null,
            competition.competition_type === '4-phase' ? '4-phase' : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </span>
      )}
      {regFact && (
        <span className={`font-semibold ${regFact.className}`}>{regFact.label}</span>
      )}
    </div>
  );
}

// The spotlight — a horizontal band bounded by two hairlines, not a card.
function SpotlightCard({
  competition,
  isLoggedIn,
}: {
  competition: CompetitionWithStats;
  isLoggedIn: boolean;
}) {
  const isOpen = competition.phase === 'registration';
  const notRegistered =
    !competition.registration_status || competition.registration_status === 'not_registered';
  const cd = competition.countdown;

  const runsRange = `${new Date(competition.registration_start).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })} – ${new Date(competition.private_test_end ?? competition.public_test_end).toLocaleDateString(
    'en-US',
    { month: 'short', day: 'numeric' }
  )}`;

  return (
    <section className="mb-8 sm:mb-12">
      <p className="text-xs font-semibold uppercase tracking-[0.09em] text-text-tertiary mb-3">
        {isOpen ? 'Registration closing soon' : 'Up next'}
      </p>
      <Link href={`/competitions/${competition.id}`} className="group block">
        <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center border-y border-border-subtle py-[22px]">
          <div className="min-w-0">
            <CardEyebrow competition={competition} isLoggedIn={isLoggedIn} />
            <h2 className="text-lg sm:text-[1.3rem] font-extrabold leading-[1.25] text-text-primary mt-2.5 mb-1.5 group-hover:text-primary-blue transition-colors">
              {competition.title}
            </h2>
            <p className="text-sm text-text-secondary leading-[1.55] line-clamp-2 sm:line-clamp-3 mb-3.5">
              {competition.description}
            </p>
            <StatRun
              size="sm"
              items={[
                { label: 'Participants', value: String(competition.participant_count) },
                ...(competition.participation_type === 'team'
                  ? [{ label: 'Teams', value: String(competition.team_count) }]
                  : []),
                { label: 'Submissions', value: String(competition.submission_count) },
                { label: 'Runs', value: runsRange },
              ]}
            />
          </div>

          <div className="sm:text-right sm:pl-7 sm:border-l sm:border-border-default">
            {cd && (
              <>
                <p className="text-xs font-mono font-bold uppercase tracking-[0.08em] text-text-tertiary mb-2">
                  {cd.label.replace(' in', ' in')}
                </p>
                <div className="flex sm:justify-end items-start gap-1.5 mb-3.5">
                  {[
                    { value: cd.days, unit: 'Days' },
                    { value: cd.hours, unit: 'Hrs' },
                    { value: cd.minutes, unit: 'Min' },
                  ].map(({ value, unit }, i, arr) => (
                    <div key={unit} className="flex items-start gap-1.5">
                      <div className="flex flex-col items-center">
                        <span className="font-mono font-bold text-[1.75rem] leading-none text-[#60A5FA] tabular-nums">
                          {String(value).padStart(2, '0')}
                        </span>
                        <span className="text-[0.6875rem] uppercase tracking-[0.08em] text-text-tertiary mt-1">
                          {unit}
                        </span>
                      </div>
                      {i < arr.length - 1 && (
                        <span className="font-mono text-xl leading-none text-text-disabled">:</span>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
            <Button variant="primary" className="w-full sm:w-auto gap-2" size="md">
              {isOpen && notRegistered ? 'Register now' : 'View details'}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Link>
    </section>
  );
}

// Titled section wrapping a grid of competition cards
function CompetitionSection({
  title,
  competitions,
  isLoggedIn,
  past = false,
}: {
  title: string;
  competitions: CompetitionWithStats[];
  isLoggedIn: boolean;
  past?: boolean;
}) {
  return (
    <section className={past ? 'border-t border-border-default pt-4' : ''}>
      <div className="flex items-baseline justify-between gap-2 mb-3.5">
        <h2 className="text-xs font-semibold uppercase tracking-[0.09em] text-text-tertiary">
          {title}
        </h2>
        <span className="font-mono text-xs text-text-disabled shrink-0">
          {competitions.length} competition{competitions.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {competitions.map((competition) => (
          <CompetitionGridCard
            key={competition.id}
            competition={competition}
            isLoggedIn={isLoggedIn}
            past={past}
          />
        ))}
      </div>
    </section>
  );
}

// A quiet card — fill + hairline, no shadow. hover lifts.
function CompetitionGridCard({
  competition,
  isLoggedIn,
  past = false,
}: {
  competition: CompetitionWithStats;
  isLoggedIn: boolean;
  past?: boolean;
}) {
  const decimals =
    SCORING_METRIC_INFO[competition.scoring_metric as keyof typeof SCORING_METRIC_INFO]
      ?.decimals ?? 4;
  const showLeader =
    competition.leader &&
    (competition.phase === 'ended' ||
      competition.phase === 'public_test' ||
      competition.phase === 'private_test');
  const showTimeline = competition.phase !== 'ended';

  return (
    <Link href={`/competitions/${competition.id}`} className="group block h-full">
      <div
        className={`h-full flex flex-col gap-3 rounded-xl border p-4 sm:p-[18px] transition-all duration-200 hover:-translate-y-1 hover:border-border-focus ${
          past ? 'bg-transparent border-border-default' : 'bg-bg-surface'
        } ${
          competition.phase === 'registration'
            ? 'border-[color:rgba(37,99,235,0.35)]'
            : 'border-border-default'
        }`}
      >
        <div>
          <CardEyebrow competition={competition} isLoggedIn={isLoggedIn} />
          <h3 className="text-lg font-extrabold leading-[1.25] text-text-primary mt-2 mb-1.5 line-clamp-2 group-hover:text-primary-blue transition-colors">
            {competition.title}
          </h3>
          <p className="text-sm text-text-secondary leading-[1.55] line-clamp-2">
            {competition.description}
          </p>
        </div>

        {showTimeline && <PhaseTimeline competition={competition} compact />}

        {showLeader && (
          <div className="flex items-baseline gap-2 text-sm text-text-tertiary">
            <Crown className="h-3.5 w-3.5 text-[#FBBF24] shrink-0 self-center" />
            <span className="shrink-0">
              {competition.phase === 'ended' ? 'Winner' : 'Leading'}
            </span>
            <span className="font-bold text-text-primary truncate">
              {competition.leader!.name}
            </span>
            <span className="font-mono text-[#22D3EE] ml-auto shrink-0">
              {competition.leader!.score.toFixed(decimals)}
            </span>
          </div>
        )}

        <div className="mt-auto pt-1 flex items-center justify-between gap-3">
          <span className="text-sm text-text-tertiary truncate">
            <b className="font-mono font-bold text-text-primary">{competition.participant_count}</b>{' '}
            participant{competition.participant_count !== 1 ? 's' : ''}
            {competition.participation_type === 'team' && competition.team_count > 0 && (
              <>
                {' · '}
                <b className="font-mono font-bold text-text-primary">{competition.team_count}</b>{' '}
                team{competition.team_count !== 1 ? 's' : ''}
              </>
            )}
            {' · '}
            <b className="font-mono font-bold text-text-primary">{competition.submission_count}</b> subs
          </span>
          <span className="text-xs font-bold text-[#60A5FA] shrink-0 group-hover:translate-x-0.5 transition-transform">
            View &rarr;
          </span>
        </div>
      </div>
    </Link>
  );
}
