'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import {
  Search,
  Filter,
  SortAsc,
  Calendar,
  Users,
  Trophy,
  Clock,
  ChevronDown,
  Loader2,
  Target,
} from 'lucide-react';

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
  const router = useRouter();
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
  const [showFilters, setShowFilters] = useState(false);

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

  // Filter and sort competitions
  const filteredAndSortedCompetitions = useMemo(() => {
    let filtered = competitions;

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
  }, [competitions, searchQuery, filterStatus, sortBy]);

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-brand text-5xl mb-4 gradient-text">Competitions</h1>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            Browse active competitions and start your AI journey
          </p>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-tertiary" />
            <Input
              type="text"
              placeholder="Search competitions by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4"
            />
          </div>

          {/* Filter and Sort Controls */}
          <div className="flex flex-wrap gap-3 items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
              aria-expanded={showFilters}
              aria-label="Toggle filters"
            >
              <Filter className="h-4 w-4" aria-hidden="true" />
              Filters
              <ChevronDown
                className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </Button>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <SortAsc className="h-4 w-4 text-text-tertiary" aria-hidden="true" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-3 py-2 bg-bg-surface border border-border-default rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-border-focus"
                aria-label="Sort competitions"
              >
                <option value="latest">Latest</option>
                <option value="ending_soon">Ending Soon</option>
                <option value="most_participants">Most Participants</option>
              </select>
            </div>

            {/* Active Filters Count */}
            {(searchQuery || filterStatus !== 'all') && (
              <span className="text-sm text-text-tertiary">
                {filteredAndSortedCompetitions.length} result
                {filteredAndSortedCompetitions.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <Card className="p-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Status
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: 'all', label: 'All' },
                      { value: 'registration', label: 'Registering' },
                      { value: 'ongoing', label: 'Ongoing' },
                      { value: 'ended', label: 'Ended' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setFilterStatus(option.value as FilterStatus)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          filterStatus === option.value
                            ? 'bg-primary-blue text-white'
                            : 'bg-bg-elevated text-text-secondary hover:bg-bg-surface border border-border-default'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary-blue" />
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredAndSortedCompetitions.length === 0 && (
          <Card className="p-12 text-center">
            <Trophy className="h-16 w-16 mx-auto mb-4 text-text-tertiary" />
            <h3 className="text-xl font-bold text-text-primary mb-2">No competitions found</h3>
            <p className="text-text-secondary">
              {searchQuery || filterStatus !== 'all'
                ? 'Try adjusting your filters or search query'
                : 'Check back soon for new competitions'}
            </p>
          </Card>
        )}

        {/* Competitions List */}
        {!loading && filteredAndSortedCompetitions.length > 0 && (
          <Card className="overflow-hidden">
            <div className="p-6 border-b border-border-default bg-bg-tertiary">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Filter className="w-5 h-5" />
                All Competitions
              </h2>
            </div>
            <div className="divide-y divide-border-default">
              {filteredAndSortedCompetitions.map((competition) => (
                <CompetitionRow
                  key={competition.id}
                  competition={competition}
                  isLoggedIn={!!userId}
                />
              ))}
            </div>
          </Card>
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

// Helper function to get phase end date for sorting
function getPhaseEndDate(comp: CompetitionWithStats): string | null {
  if (comp.phase === 'ended') return null;
  if (comp.phase === 'registration') return comp.registration_end;
  if (comp.phase === 'public_test') return comp.public_test_end;
  if (comp.phase === 'private_test') return comp.private_test_end;
  return null;
}

// Competition Row Component (list style like admin page)
function CompetitionRow({
  competition,
  isLoggedIn,
}: {
  competition: CompetitionWithStats;
  isLoggedIn: boolean;
}) {
  const router = useRouter();

  const phaseConfig = {
    upcoming: { label: 'Coming Soon', variant: 'secondary' as const },
    registration: { label: 'Registration Open', variant: 'registration' as const },
    public_test: { label: 'Public Test', variant: 'public' as const },
    private_test: { label: 'Private Test', variant: 'private' as const },
    ended: { label: 'Ended', variant: 'ended' as const },
  };

  const phaseInfo = phaseConfig[competition.phase];

  const registrationBadge = () => {
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
  };

  return (
    <div
      className="p-6 hover:bg-bg-tertiary/50 transition-colors cursor-pointer"
      onClick={() => router.push(`/competitions/${competition.id}`)}
    >
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1 min-w-0">
          {/* Title & Badges */}
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <h3 className="text-xl font-bold">{competition.title}</h3>
            <Badge variant={phaseInfo.variant}>{phaseInfo.label}</Badge>
            <Badge variant="tech">
              {competition.scoring_metric.replace('_', ' ').toUpperCase()}
            </Badge>
            {competition.participation_type === 'team' && (
              <Badge variant="outline">Team</Badge>
            )}
            {competition.competition_type === '4-phase' && (
              <Badge variant="outline">4-Phase</Badge>
            )}
            {registrationBadge()}
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
                  {competition.participant_count}
                </strong>{' '}
                participants
                {competition.participation_type === 'team' && competition.team_count > 0 && (
                  <span className="text-text-tertiary ml-1">
                    ({competition.team_count} teams)
                  </span>
                )}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-text-tertiary" />
              <span className="text-text-secondary">
                <strong className="text-text-primary">
                  {competition.submission_count}
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

        {/* Countdown or Ended Box (right side) */}
        {competition.phase === 'ended' ? (
          <div className="flex-shrink-0 p-3 bg-bg-elevated rounded-lg border border-border-default min-w-[140px]">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-4 w-4 text-text-tertiary" />
              <span className="text-xs text-text-tertiary uppercase font-mono">
                Status
              </span>
            </div>
            <div className="text-center py-2">
              <div className="text-sm font-medium text-text-secondary">
                This competition has ended
              </div>
            </div>
          </div>
        ) : competition.countdown ? (
          <div className="flex-shrink-0 p-3 bg-bg-elevated rounded-lg border border-border-default min-w-[140px]">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-primary-blue" />
              <span className="text-xs text-text-tertiary uppercase font-mono">
                {competition.countdown.label.replace(' in', '')}
              </span>
            </div>
            <div className="flex gap-2 text-center">
              <div className="flex-1">
                <div className="text-lg font-bold text-primary-blue font-mono">
                  {competition.countdown.days}
                </div>
                <div className="text-xs text-text-tertiary">Days</div>
              </div>
              <div className="flex-1">
                <div className="text-lg font-bold text-primary-blue font-mono">
                  {competition.countdown.hours}
                </div>
                <div className="text-xs text-text-tertiary">Hrs</div>
              </div>
              <div className="flex-1">
                <div className="text-lg font-bold text-primary-blue font-mono">
                  {competition.countdown.minutes}
                </div>
                <div className="text-xs text-text-tertiary">Min</div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
