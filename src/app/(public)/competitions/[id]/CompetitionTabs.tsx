'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { SCORING_METRIC_INFO, metricShortName } from '@/lib/constants';
import { Markdown } from '@/components/ui/Markdown';
import { StatRun } from '@/components/ui/StatRun';
import LeaderboardTable, { type LeaderboardEntry } from '@/components/leaderboard/LeaderboardTable';
import type { CompetitionPhase } from '@/lib/utils/competition';

interface CompetitionTabsProps {
  competition: any;
  leaderboard: any[];
  isRegistered: boolean;
  userId?: string;
  currentPhase: CompetitionPhase;
}

type TabType = 'overview' | 'leaderboard' | 'individual_leaderboard' | 'submissions';

export default function CompetitionTabs({
  competition,
  leaderboard: initialLeaderboard,
  isRegistered,
  userId,
  currentPhase,
}: CompetitionTabsProps) {
  // Leaderboard leads once the competition is running or finished; Overview otherwise.
  const [activeTab, setActiveTab] = useState<TabType>(
    currentPhase === 'public_test' || currentPhase === 'private_test' || currentPhase === 'ended'
      ? 'leaderboard'
      : 'overview'
  );
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState(initialLeaderboard);
  const [individualLeaderboard, setIndividualLeaderboard] = useState<any[]>([]);
  const [finalLeaderboard, setFinalLeaderboard] = useState<any[]>([]);
  const [individualFinalLeaderboard, setIndividualFinalLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [userTeamId, setUserTeamId] = useState<string | null>(null);

  // Fetch user's team ID for team competitions
  useEffect(() => {
    const fetchUserTeam = async () => {
      if (!userId || competition.participation_type !== 'team') return;

      const supabase = createClient();

      // First get all user's team memberships
      const { data: memberships } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', userId);

      if (!memberships || memberships.length === 0) return;

      // Find which of the user's teams has an approved registration for this competition
      const teamIds = memberships.map((m: any) => m.team_id);
      const { data: registrations } = await supabase
        .from('registrations')
        .select('team_id')
        .eq('competition_id', competition.id)
        .eq('status', 'approved')
        .in('team_id', teamIds)
        .limit(1);

      if (registrations && registrations.length > 0) {
        setUserTeamId((registrations[0] as any).team_id);
      }
    };

    fetchUserTeam();
  }, [userId, competition.id, competition.participation_type]);

  // Determine default phase based on competition state
  const getDefaultPhase = (): 'public' | 'private' | 'final' => {
    const now = new Date();
    const privateTestEnd = competition.private_test_end ? new Date(competition.private_test_end) : null;
    const privateTestStart = competition.private_test_start ? new Date(competition.private_test_start) : null;
    const is4Phase = competition.competition_type === '4-phase';

    if (is4Phase && privateTestEnd && now > privateTestEnd) {
      return 'final'; // Competition ended
    } else if (is4Phase && privateTestStart && now >= privateTestStart) {
      return 'private'; // In private phase
    }
    return 'public'; // Default or public phase
  };

  const [leaderboardPhase, setLeaderboardPhase] = useState<'public' | 'private' | 'final'>(getDefaultPhase());
  const [individualLeaderboardPhase, setIndividualLeaderboardPhase] = useState<'public' | 'private' | 'final'>(getDefaultPhase());

  // Fetch user submissions when switching to submissions tab
  useEffect(() => {
    if (activeTab === 'submissions' && isRegistered && userId) {
      fetchUserSubmissions();
    }
  }, [activeTab, isRegistered, userId]);

  // Fetch full leaderboard when switching to leaderboard tab or changing phase
  useEffect(() => {
    if (activeTab === 'leaderboard') {
      if (leaderboardPhase === 'final') {
        fetchFinalLeaderboard(false);
      } else {
        fetchFullLeaderboard();
      }
    }
  }, [activeTab, leaderboardPhase]);

  // Fetch individual leaderboard for team competitions when switching tab or changing phase
  useEffect(() => {
    if (activeTab === 'individual_leaderboard' && competition.participation_type === 'team') {
      if (individualLeaderboardPhase === 'final') {
        fetchFinalLeaderboard(true);
      } else {
        fetchIndividualLeaderboard();
      }
    }
  }, [activeTab, individualLeaderboardPhase]);

  const fetchUserSubmissions = async () => {
    if (!userId) return;

    setLoading(true);
    const supabase = createClient();

    // FIXED: For team competitions, fetch team submissions
    const isTeamCompetition = competition.participation_type === 'team';

    let query = supabase
      .from('submissions')
      .select('id, file_name, phase, score, validation_status, is_best_score, submitted_at, submitted_by, user_id, team_id')
      .eq('competition_id', competition.id);

    if (isTeamCompetition) {
      // For team competitions, get submissions where user is a team member
      // First get user's team for this competition
      const { data: teamMembers } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', userId);

      if (teamMembers && teamMembers.length > 0) {
        const teamIds = teamMembers.map((tm: any) => tm.team_id);
        query = query.in('team_id', teamIds);
      } else {
        // User not in any team, no submissions
        setSubmissions([]);
        setLoading(false);
        return;
      }
    } else {
      // For individual competitions, get user submissions
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.order('submitted_at', { ascending: false });

    if (!error && data) {
      setSubmissions(data);
    }
    setLoading(false);
  };

  const fetchFullLeaderboard = async () => {
    setLoading(true);
    const supabase = createClient();

    // Determine sort order based on metric type
    const metricInfo = SCORING_METRIC_INFO[competition.scoring_metric as keyof typeof SCORING_METRIC_INFO];
    const ascending = metricInfo?.higher_is_better === false; // true for MAE/RMSE (lower is better)

    // FIXED: Separate individual and team leaderboards for fairness!
    const isTeamCompetition = competition.participation_type === 'team';

    // Build query with participation type filter
    let query = supabase
      .from('submissions')
      .select(`
        id,
        score,
        submitted_at,
        user_id,
        team_id,
        phase,
        validation_status,
        users!submissions_user_id_fkey (
          id,
          full_name,
          email
        ),
        teams!submissions_team_id_fkey (
          id,
          name
        )
      `)
      .eq('competition_id', competition.id)
      .eq('validation_status', 'valid')
      .eq('phase', leaderboardPhase);

    // CRITICAL: Filter by participation type to ensure fairness
    if (isTeamCompetition) {
      query = query.not('team_id', 'is', null); // Only team submissions
    } else {
      query = query.not('user_id', 'is', null); // Only individual submissions
    }

    const { data: allSubs } = await query
      .order('score', { ascending }) // Dynamic sorting based on metric
      .order('submitted_at', { ascending: true });

    if (allSubs) {
      // Get unique entities (users OR teams) with their best scores and submission counts
      const bestScores = new Map();
      const submissionCounts = new Map(); // Track submission count per entity

      allSubs.forEach((sub: any) => {
        const entityId = isTeamCompetition ? sub.team_id : sub.user_id;
        if (!entityId) return;

        // Count submissions for this entity
        submissionCounts.set(entityId, (submissionCounts.get(entityId) || 0) + 1);

        if (!bestScores.has(entityId)) {
          bestScores.set(entityId, sub);
        }
      });

      // Add submission counts to leaderboard entries
      const leaderboardWithCounts = Array.from(bestScores.values()).map((entry: any) => {
        const entityId = isTeamCompetition ? entry.team_id : entry.user_id;
        return {
          ...entry,
          submission_count: submissionCounts.get(entityId) || 0
        };
      });

      setLeaderboard(leaderboardWithCounts.slice(0, 100));
    }
    setLoading(false);
  };

  const fetchIndividualLeaderboard = async () => {
    setLoading(true);
    const supabase = createClient();

    // Determine sort order based on metric type
    const metricInfo = SCORING_METRIC_INFO[competition.scoring_metric as keyof typeof SCORING_METRIC_INFO];
    const ascending = metricInfo?.higher_is_better === false;

    // For team competitions, show individual member rankings
    // Get all team submissions, then rank by individual submitters
    const { data: allSubs } = await supabase
      .from('submissions')
      .select(`
        id,
        score,
        submitted_at,
        submitted_by,
        team_id,
        phase,
        validation_status,
        teams!submissions_team_id_fkey (
          id,
          name
        )
      `)
      .eq('competition_id', competition.id)
      .eq('validation_status', 'valid')
      .eq('phase', individualLeaderboardPhase)
      .not('team_id', 'is', null)
      .order('score', { ascending })
      .order('submitted_at', { ascending: true });

    if (allSubs) {
      // Get unique individual submitters with their best scores and submission counts
      const bestScores = new Map();
      const submissionCounts = new Map(); // Track submission count per submitter

      allSubs.forEach((sub: any) => {
        const submitterId = sub.submitted_by;
        if (!submitterId) return;

        // Count submissions for this submitter
        submissionCounts.set(submitterId, (submissionCounts.get(submitterId) || 0) + 1);

        if (!bestScores.has(submitterId)) {
          bestScores.set(submitterId, sub);
        }
      });

      // Fetch user details for submitters
      const submitterIds = Array.from(bestScores.keys());
      const { data: users } = await supabase
        .from('users')
        .select('id, full_name, email')
        .in('id', submitterIds);

      // Combine submissions with user data and submission counts
      const leaderboardWithUsers = Array.from(bestScores.values()).map((sub: any) => ({
        ...sub,
        users: users?.find((u: any) => u.id === sub.submitted_by),
        submission_count: submissionCounts.get(sub.submitted_by) || 0
      }));

      setIndividualLeaderboard(leaderboardWithUsers.slice(0, 100));
    }
    setLoading(false);
  };

  // Fetch Final leaderboard (combines public + private scores)
  const fetchFinalLeaderboard = async (isIndividual: boolean) => {
    setLoading(true);
    const supabase = createClient();

    const metricInfo = SCORING_METRIC_INFO[competition.scoring_metric as keyof typeof SCORING_METRIC_INFO];
    const higherIsBetter = metricInfo?.higher_is_better !== false;
    const isTeamComp = competition.participation_type === 'team';

    // Fetch all valid submissions for both phases
    let query = supabase
      .from('submissions')
      .select(`
        id,
        score,
        submitted_at,
        user_id,
        team_id,
        submitted_by,
        phase,
        validation_status,
        users!submissions_user_id_fkey (
          id,
          full_name,
          email
        ),
        teams!submissions_team_id_fkey (
          id,
          name
        )
      `)
      .eq('competition_id', competition.id)
      .eq('validation_status', 'valid')
      .in('phase', ['public', 'private']);

    if (isIndividual && isTeamComp) {
      // Individual leaderboard for team competition - group by submitted_by
      query = query.not('team_id', 'is', null);
    } else if (isTeamComp) {
      // Team leaderboard
      query = query.not('team_id', 'is', null);
    } else {
      // Individual competition
      query = query.not('user_id', 'is', null);
    }

    const { data: allSubs } = await query;

    if (allSubs) {
      // Group by entity (team_id, user_id, or submitted_by for individual in team comp)
      const entityScores = new Map<string, {
        entityId: string;
        publicScore: number | null;
        privateScore: number | null;
        publicSubmissions: number;
        privateSubmissions: number;
        publicBestAt: string | null;
        privateBestAt: string | null;
        teamName?: string;
        userName?: string;
        userEmail?: string;
      }>();

      allSubs.forEach((sub: any) => {
        let entityId: string;
        let teamName: string | undefined;
        let userName: string | undefined;
        let userEmail: string | undefined;

        if (isIndividual && isTeamComp) {
          entityId = sub.submitted_by;
          teamName = sub.teams?.name;
        } else if (isTeamComp) {
          entityId = sub.team_id;
          teamName = sub.teams?.name;
        } else {
          entityId = sub.user_id;
          userName = sub.users?.full_name;
          userEmail = sub.users?.email;
        }

        if (!entityId) return;

        if (!entityScores.has(entityId)) {
          entityScores.set(entityId, {
            entityId,
            publicScore: null,
            privateScore: null,
            publicSubmissions: 0,
            privateSubmissions: 0,
            publicBestAt: null,
            privateBestAt: null,
            teamName,
            userName,
            userEmail,
          });
        }

        const entity = entityScores.get(entityId)!;

        // Update team/user name if not set
        if (teamName && !entity.teamName) entity.teamName = teamName;
        if (userName && !entity.userName) entity.userName = userName;
        if (userEmail && !entity.userEmail) entity.userEmail = userEmail;

        if (sub.phase === 'public') {
          entity.publicSubmissions++;
          if (entity.publicScore === null ||
              (higherIsBetter ? sub.score > entity.publicScore : sub.score < entity.publicScore)) {
            entity.publicScore = sub.score;
            entity.publicBestAt = sub.submitted_at;
          }
        } else if (sub.phase === 'private') {
          entity.privateSubmissions++;
          if (entity.privateScore === null ||
              (higherIsBetter ? sub.score > entity.privateScore : sub.score < entity.privateScore)) {
            entity.privateScore = sub.score;
            entity.privateBestAt = sub.submitted_at;
          }
        }
      });

      // If individual leaderboard for team comp, fetch user details
      if (isIndividual && isTeamComp) {
        const submitterIds = Array.from(entityScores.keys());
        const { data: users } = await supabase
          .from('users')
          .select('id, full_name, email')
          .in('id', submitterIds);

        if (users) {
          users.forEach((user: any) => {
            const entity = entityScores.get(user.id);
            if (entity) {
              entity.userName = user.full_name;
              entity.userEmail = user.email;
            }
          });
        }
      }

      // Convert to array and calculate average
      const leaderboardData = Array.from(entityScores.values()).map(entity => {
        const hasPublic = entity.publicScore !== null;
        const hasPrivate = entity.privateScore !== null;
        const hasBoth = hasPublic && hasPrivate;

        let average: number | null = null;
        let sortScore: number;

        if (hasBoth) {
          average = (entity.publicScore! + entity.privateScore!) / 2;
          sortScore = average;
        } else if (hasPublic) {
          sortScore = entity.publicScore!;
        } else if (hasPrivate) {
          sortScore = entity.privateScore!;
        } else {
          sortScore = higherIsBetter ? -Infinity : Infinity;
        }

        return {
          ...entity,
          average,
          hasBoth,
          sortScore,
          totalSubmissions: entity.publicSubmissions + entity.privateSubmissions,
        };
      });

      // Sort: entities with both scores first (by average), then single-score entities
      leaderboardData.sort((a, b) => {
        // Both have complete scores
        if (a.hasBoth && b.hasBoth) {
          return higherIsBetter ? b.sortScore - a.sortScore : a.sortScore - b.sortScore;
        }
        // One has both, other doesn't - the one with both ranks higher
        if (a.hasBoth && !b.hasBoth) return -1;
        if (!a.hasBoth && b.hasBoth) return 1;
        // Neither has both - sort by their available score
        return higherIsBetter ? b.sortScore - a.sortScore : a.sortScore - b.sortScore;
      });

      if (isIndividual) {
        setIndividualFinalLeaderboard(leaderboardData.slice(0, 100));
      } else {
        setFinalLeaderboard(leaderboardData.slice(0, 100));
      }
    }
    setLoading(false);
  };

  const isTeamCompetition = competition.participation_type === 'team';

  const tabs: { id: TabType; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'leaderboard', label: isTeamCompetition ? 'Team Leaderboard' : 'Leaderboard' },
    ...(isTeamCompetition ? [{ id: 'individual_leaderboard' as TabType, label: 'Individual' }] : []),
    ...(isRegistered ? [{ id: 'submissions' as TabType, label: 'My Submissions' }] : []),
  ];

  return (
    <div className="space-y-5">
      {/* Tab navigation — underline style */}
      <div className="flex gap-1 border-b border-border-default overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-[11px] text-sm font-bold whitespace-nowrap shrink-0 border-b-2 -mb-px transition-colors ${
              activeTab === tab.id
                ? 'border-primary-blue text-text-primary'
                : 'border-transparent text-text-tertiary hover:text-text-secondary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && <OverviewTab competition={competition} />}
        {activeTab === 'leaderboard' && (
          <LeaderboardTab
            leaderboard={leaderboard}
            finalLeaderboard={finalLeaderboard}
            loading={loading}
            competition={competition}
            phase={leaderboardPhase}
            onPhaseChange={setLeaderboardPhase}
            userBestScore={getUserBestScore(leaderboard)}
            userRank={getUserRank(leaderboard)}
            isRegistered={isRegistered}
            isLoggedIn={!!userId}
            userEntityId={competition.participation_type === 'team' ? userTeamId || undefined : userId}
          />
        )}
        {activeTab === 'individual_leaderboard' && (
          <IndividualLeaderboardTab
            leaderboard={individualLeaderboard}
            finalLeaderboard={individualFinalLeaderboard}
            loading={loading}
            competition={competition}
            phase={individualLeaderboardPhase}
            onPhaseChange={setIndividualLeaderboardPhase}
            userBestScore={getUserBestScoreIndividual(individualLeaderboard)}
            userRank={getUserRankIndividual(individualLeaderboard)}
            isRegistered={isRegistered}
            isLoggedIn={!!userId}
            userId={userId}
          />
        )}
        {activeTab === 'submissions' && (
          <SubmissionsTab submissions={submissions} loading={loading} competition={competition} />
        )}
      </div>
    </div>
  );

  // Helper functions to get user's position in leaderboard
  function getUserBestScore(lb: any[]): number | undefined {
    const isTeamComp = competition.participation_type === 'team';
    if (isTeamComp) {
      if (!userTeamId) return undefined;
      const teamEntry = lb.find(entry => entry.team_id === userTeamId);
      return teamEntry?.score;
    } else {
      const userEntry = lb.find(entry => entry.user_id === userId);
      return userEntry?.score;
    }
  }

  function getUserRank(lb: any[]): number | undefined {
    const isTeamComp = competition.participation_type === 'team';
    if (isTeamComp) {
      if (!userTeamId) return undefined;
      const index = lb.findIndex(entry => entry.team_id === userTeamId);
      return index >= 0 ? index + 1 : undefined;
    } else {
      const index = lb.findIndex(entry => entry.user_id === userId);
      return index >= 0 ? index + 1 : undefined;
    }
  }

  function getUserBestScoreIndividual(lb: any[]): number | undefined {
    const userEntry = lb.find(entry => entry.submitted_by === userId);
    return userEntry?.score;
  }

  function getUserRankIndividual(lb: any[]): number | undefined {
    const index = lb.findIndex(entry => entry.submitted_by === userId);
    return index >= 0 ? index + 1 : undefined;
  }
}

// Overview Tab — Markdown problem statement + an Evaluation section
// (folded in from the removed sidebar so nothing is lost).
function OverviewTab({ competition }: { competition: any }) {
  const metricInfo =
    SCORING_METRIC_INFO[competition.scoring_metric as keyof typeof SCORING_METRIC_INFO];
  const direction =
    metricInfo?.higher_is_better === false ? 'Lower is better ↓' : 'Higher is better ↑';

  return (
    <div className="max-w-[85ch] mx-auto">
      <h3 className="text-xs font-semibold uppercase tracking-[0.09em] text-text-tertiary mb-3">
        Problem statement
      </h3>
      {competition.problem_statement ? (
        <Markdown>{competition.problem_statement}</Markdown>
      ) : (
        <p className="text-sm text-text-tertiary">No problem statement provided yet.</p>
      )}

      <h3 className="text-xs font-semibold uppercase tracking-[0.09em] text-text-tertiary mt-9 mb-3">
        Evaluation
      </h3>
      <p className="text-sm text-text-secondary leading-[1.65] mb-1.5">
        <span className="text-text-primary font-bold">
          {metricInfo?.name ?? competition.scoring_metric}
        </span>{' '}
        — {direction}.
      </p>
      {metricInfo?.description && (
        <p className="text-sm text-text-tertiary leading-[1.65] mb-3">{metricInfo.description}</p>
      )}
      <p className="text-sm text-text-secondary leading-[1.65]">
        Submit a <span className="font-mono text-[#22D3EE]">.csv</span> file, up to{' '}
        {competition.max_file_size_mb ?? 10} MB.
      </p>
    </div>
  );
}

// Phase Tabs Navigation Component
function PhaseTabsNav({
  phase,
  onPhaseChange,
  showFinal,
  showPrivate
}: {
  phase: 'public' | 'private' | 'final';
  onPhaseChange: (phase: 'public' | 'private' | 'final') => void;
  showFinal: boolean;
  showPrivate: boolean;
}) {
  // If only public phase, don't show tabs at all
  if (!showPrivate && !showFinal) {
    return null;
  }

  const linkClass = (isActive: boolean, active = 'text-text-primary border-primary-blue') =>
    `pb-1 text-sm font-bold whitespace-nowrap shrink-0 border-b-2 transition-colors ${
      isActive ? active : 'border-transparent text-text-tertiary hover:text-text-secondary'
    }`;

  return (
    <div className="flex gap-5 mb-5 overflow-x-auto scrollbar-none">
      <button onClick={() => onPhaseChange('public')} className={linkClass(phase === 'public')}>
        Public Phase
      </button>
      {showPrivate && (
        <button onClick={() => onPhaseChange('private')} className={linkClass(phase === 'private')}>
          Private Phase
        </button>
      )}
      {showFinal && (
        <button
          onClick={() => onPhaseChange('final')}
          className={linkClass(phase === 'final', 'text-[#FBBF24] border-[#FBBF24]')}
        >
          Final
        </button>
      )}
    </div>
  );
}

// Smart binning function using IQR to focus on data concentration
function calculateSmartBins(scores: number[], higherIsBetter: boolean): {
  bins: { min: number; max: number; count: number; hasUser: boolean; isOutlier: boolean }[];
  focusMin: number;
  focusMax: number;
  outlierCount: { low: number; high: number };
} {
  const sorted = [...scores].sort((a, b) => a - b);
  const n = sorted.length;

  // Calculate quartiles
  const q1Index = Math.floor(n * 0.25);
  const q3Index = Math.floor(n * 0.75);
  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];
  const iqr = q3 - q1;

  // Define focus range (expand slightly beyond IQR for context)
  const focusMin = Math.max(sorted[0], q1 - iqr * 0.5);
  const focusMax = Math.min(sorted[n - 1], q3 + iqr * 0.5);
  const focusRange = focusMax - focusMin;

  // Count outliers
  const lowOutliers = scores.filter(s => s < focusMin);
  const highOutliers = scores.filter(s => s > focusMax);
  const mainScores = scores.filter(s => s >= focusMin && s <= focusMax);

  // Create bins for the focus range
  const binCount = Math.min(12, Math.max(5, Math.ceil(mainScores.length / 2)));
  const binSize = focusRange === 0 ? 1 : focusRange / binCount;

  const bins: { min: number; max: number; count: number; hasUser: boolean; isOutlier: boolean }[] = [];

  // Add low outlier bin if any
  if (lowOutliers.length > 0) {
    bins.push({
      min: sorted[0],
      max: focusMin,
      count: lowOutliers.length,
      hasUser: false,
      isOutlier: true
    });
  }

  // Add main bins
  for (let i = 0; i < binCount; i++) {
    const binMin = focusMin + i * binSize;
    const binMax = i === binCount - 1 ? focusMax + 0.0001 : focusMin + (i + 1) * binSize;
    bins.push({
      min: binMin,
      max: binMax,
      count: 0,
      hasUser: false,
      isOutlier: false
    });
  }

  // Add high outlier bin if any
  if (highOutliers.length > 0) {
    bins.push({
      min: focusMax,
      max: sorted[n - 1],
      count: highOutliers.length,
      hasUser: false,
      isOutlier: true
    });
  }

  // Fill main bins with scores
  mainScores.forEach(score => {
    const startIndex = lowOutliers.length > 0 ? 1 : 0;
    const binIndex = Math.min(
      Math.floor((score - focusMin) / binSize),
      binCount - 1
    ) + startIndex;
    if (bins[binIndex] && !bins[binIndex].isOutlier) {
      bins[binIndex].count++;
    }
  });

  return {
    bins,
    focusMin,
    focusMax,
    outlierCount: { low: lowOutliers.length, high: highOutliers.length }
  };
}

// Score Distribution Chart Component
function ScoreDistributionChart({
  scores,
  userBestScore,
  userRank,
  isRegistered,
  isLoggedIn,
  totalParticipants,
  competition
}: {
  scores: number[];
  userBestScore?: number;
  userRank?: number;
  isRegistered: boolean;
  isLoggedIn: boolean;
  totalParticipants: number;
  competition: any;
}) {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  if (scores.length === 0) return null;

  const metricInfo = SCORING_METRIC_INFO[competition.scoring_metric as keyof typeof SCORING_METRIC_INFO];
  const higherIsBetter = metricInfo?.higher_is_better !== false;
  const decimals = metricInfo?.decimals || 4;

  // Use smart binning for better distribution visualization
  const { bins, focusMin, focusMax, outlierCount } = calculateSmartBins(scores, higherIsBetter);

  // Mark user's bin
  if (userBestScore !== undefined) {
    for (const bin of bins) {
      if (userBestScore >= bin.min && userBestScore < bin.max) {
        bin.hasUser = true;
        break;
      }
      // Handle edge case for max value
      if (userBestScore === bin.max && bin === bins[bins.length - 1]) {
        bin.hasUser = true;
      }
    }
  }

  const maxCount = Math.max(...bins.map(b => b.count));

  // Calculate stats
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const sortedScores = [...scores].sort((a, b) => a - b);
  const median = sortedScores.length % 2 === 0
    ? (sortedScores[sortedScores.length / 2 - 1] + sortedScores[sortedScores.length / 2]) / 2
    : sortedScores[Math.floor(sortedScores.length / 2)];

  const behindLeader = higherIsBetter
    ? sortedScores[sortedScores.length - 1] - (userBestScore ?? 0)
    : (userBestScore ?? 0) - sortedScores[0];

  return (
    <div className="mb-6">
      <p className="text-xs font-semibold uppercase tracking-[0.06em] text-text-tertiary mb-2.5">
        Score distribution{' '}
        <span className="font-mono normal-case tracking-normal text-text-secondary">
          · {higherIsBetter ? 'higher is better →' : 'lower is better ←'} · {totalParticipants}{' '}
          {totalParticipants === 1 ? 'entry' : 'entries'} · avg {avg.toFixed(decimals)} · median{' '}
          {median.toFixed(decimals)}
        </span>
      </p>

      {/* Histogram — bars only, no card */}
      <div className="flex items-end gap-[3px] h-[72px]">
        {bins.map((bin, index) => {
          const heightPercent = maxCount > 0 ? (bin.count / maxCount) * 100 : 0;
          const isHovered = hoveredBar === index;
          const displayHeight = bin.count > 0 ? Math.max(heightPercent, 6) : 0;
          const isOutlierBin = bin.isOutlier;

          return (
            <div
              key={index}
              className={`relative cursor-default ${isOutlierBin ? 'flex-[0.5]' : 'flex-1'}`}
              onMouseEnter={() => setHoveredBar(index)}
              onMouseLeave={() => setHoveredBar(null)}
            >
              <div
                className={`w-full rounded-t-[2px] transition-opacity ${
                  bin.hasUser
                    ? 'bg-gradient-to-t from-[#D97706] to-[#FBBF24] opacity-100'
                    : isOutlierBin
                      ? 'bg-bg-elevated'
                      : 'bg-gradient-to-t from-[#2563EB] to-[#22D3EE] opacity-75'
                }`}
                style={{ height: `${(displayHeight / 100) * 72}px` }}
              />
              {isHovered && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 whitespace-nowrap">
                  <div className="bg-bg-primary border border-border-default rounded-lg px-3 py-2 shadow-lg">
                    <div className="text-xs font-mono text-text-secondary">
                      {isOutlierBin
                        ? index === 0 && outlierCount.low > 0
                          ? `< ${focusMin.toFixed(2)} (outliers)`
                          : `> ${focusMax.toFixed(2)} (outliers)`
                        : `${bin.min.toFixed(2)} – ${bin.max.toFixed(2)}`}
                    </div>
                    <div className="text-sm font-bold text-text-primary">
                      {bin.count} {bin.count === 1 ? 'entry' : 'entries'}
                    </div>
                    {bin.hasUser && (
                      <div className="text-xs text-[#FBBF24] font-medium mt-1">Your score is here</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Axis */}
      <div className="flex justify-between font-mono text-[0.6875rem] text-text-disabled mt-1.5 pt-1.5 border-t border-border-default">
        <span>{sortedScores[0].toFixed(2)}</span>
        <span className="text-[#22D3EE]">{median.toFixed(2)} median</span>
        <span>{sortedScores[sortedScores.length - 1].toFixed(2)}</span>
      </div>

      {/* Your position — a stat run, or a one-line prompt */}
      <div className="mt-5">
        {isLoggedIn && isRegistered && userBestScore !== undefined ? (
          <StatRun
            size="sm"
            items={[
              { label: 'Your best score', value: userBestScore.toFixed(decimals), tone: 'warn' },
              {
                label: 'Your rank',
                value: (
                  <>
                    #{userRank}
                    <span className="text-xs font-normal text-text-disabled"> / {totalParticipants}</span>
                  </>
                ),
              },
              { label: higherIsBetter ? 'Behind leader' : 'Above leader', value: behindLeader.toFixed(decimals) },
            ]}
          />
        ) : (
          <p className="text-sm text-text-tertiary">
            {isLoggedIn && isRegistered
              ? "You haven't submitted yet — submit a solution to see your position."
              : isLoggedIn
                ? 'Register to submit and see your position on this chart.'
                : 'Log in and register to submit and see your position.'}
          </p>
        )}
      </div>
    </div>
  );
}

// Final Score Distribution Chart Component (uses average scores)
function FinalScoreDistributionChart({
  data,
  userEntityId,
  isRegistered,
  isLoggedIn,
  competition
}: {
  data: any[];
  userEntityId?: string;
  isRegistered: boolean;
  isLoggedIn: boolean;
  competition: any;
}) {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  // Only show entries that have both scores (with average)
  const entriesWithAverage = data.filter(entry => entry.average !== null);
  if (entriesWithAverage.length === 0) return null;

  const scores = entriesWithAverage.map(entry => entry.average as number);
  const metricInfo = SCORING_METRIC_INFO[competition.scoring_metric as keyof typeof SCORING_METRIC_INFO];
  const higherIsBetter = metricInfo?.higher_is_better !== false;
  const decimals = metricInfo?.decimals || 4;

  // Use smart binning for better distribution visualization
  const { bins, focusMin, focusMax, outlierCount } = calculateSmartBins(scores, higherIsBetter);

  // Find user's entry and score
  const userEntry = userEntityId ? data.find(entry => entry.entityId === userEntityId) : null;
  const userAverage = userEntry?.average;
  const userRank = userEntry ? entriesWithAverage.findIndex(e => e.entityId === userEntityId) + 1 : undefined;

  // Mark user's bin
  if (userAverage !== undefined && userAverage !== null) {
    for (const bin of bins) {
      if (userAverage >= bin.min && userAverage < bin.max) {
        bin.hasUser = true;
        break;
      }
      // Handle edge case for max value
      if (userAverage === bin.max && bin === bins[bins.length - 1]) {
        bin.hasUser = true;
      }
    }
  }

  const maxCount = Math.max(...bins.map(b => b.count));
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const sortedScores = [...scores].sort((a, b) => a - b);
  const median = sortedScores.length % 2 === 0
    ? (sortedScores[sortedScores.length / 2 - 1] + sortedScores[sortedScores.length / 2]) / 2
    : sortedScores[Math.floor(sortedScores.length / 2)];

  return (
    <div className="mb-6">
      <p className="text-xs font-semibold uppercase tracking-[0.06em] text-text-tertiary mb-2.5">
        Final score distribution{' '}
        <span className="font-mono normal-case tracking-normal text-text-secondary">
          · average of public + private · {entriesWithAverage.length} complete · avg{' '}
          {avg.toFixed(decimals)} · median {median.toFixed(decimals)}
        </span>
      </p>

      <div className="flex items-end gap-[3px] h-[72px]">
        {bins.map((bin, index) => {
          const heightPercent = maxCount > 0 ? (bin.count / maxCount) * 100 : 0;
          const isHovered = hoveredBar === index;
          const displayHeight = bin.count > 0 ? Math.max(heightPercent, 6) : 0;
          const isOutlierBin = bin.isOutlier;

          return (
            <div
              key={index}
              className={`relative cursor-default ${isOutlierBin ? 'flex-[0.5]' : 'flex-1'}`}
              onMouseEnter={() => setHoveredBar(index)}
              onMouseLeave={() => setHoveredBar(null)}
            >
              <div
                className={`w-full rounded-t-[2px] transition-opacity ${
                  bin.hasUser
                    ? 'bg-gradient-to-t from-[#D97706] to-[#FBBF24] opacity-100'
                    : isOutlierBin
                      ? 'bg-bg-elevated'
                      : 'bg-gradient-to-t from-[#2563EB] to-[#22D3EE] opacity-75'
                }`}
                style={{ height: `${(displayHeight / 100) * 72}px` }}
              />
              {isHovered && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 whitespace-nowrap">
                  <div className="bg-bg-primary border border-border-default rounded-lg px-3 py-2 shadow-lg">
                    <div className="text-xs font-mono text-text-secondary">
                      {isOutlierBin
                        ? index === 0 && outlierCount.low > 0
                          ? `< ${focusMin.toFixed(2)} (outliers)`
                          : `> ${focusMax.toFixed(2)} (outliers)`
                        : `${bin.min.toFixed(2)} – ${bin.max.toFixed(2)}`}
                    </div>
                    <div className="text-sm font-bold text-text-primary">
                      {bin.count} {bin.count === 1 ? 'entry' : 'entries'}
                    </div>
                    {bin.hasUser && (
                      <div className="text-xs text-[#FBBF24] font-medium mt-1">Your average is here</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-between font-mono text-[0.6875rem] text-text-disabled mt-1.5 pt-1.5 border-t border-border-default">
        <span>{sortedScores[0].toFixed(2)}</span>
        <span className="text-[#22D3EE]">{median.toFixed(2)} median</span>
        <span>{sortedScores[sortedScores.length - 1].toFixed(2)}</span>
      </div>

      <div className="mt-5">
        {isLoggedIn && isRegistered && userAverage !== undefined && userAverage !== null ? (
          <StatRun
            size="sm"
            items={[
              { label: 'Your final average', value: userAverage.toFixed(decimals), tone: 'warn' },
              {
                label: 'Final rank',
                value: (
                  <>
                    #{userRank}
                    <span className="text-xs font-normal text-text-disabled"> / {entriesWithAverage.length}</span>
                  </>
                ),
              },
            ]}
          />
        ) : (
          <p className="text-sm text-text-tertiary">
            {isLoggedIn && isRegistered && userEntry
              ? 'You need both a public and a private score to appear in the final ranking.'
              : isLoggedIn && isRegistered
                ? 'No submissions found for this competition.'
                : isLoggedIn
                  ? "You weren't registered for this competition."
                  : 'Log in to view your final ranking if you participated.'}
          </p>
        )}
      </div>
    </div>
  );
}

// Final Leaderboard Table Component
function FinalLeaderboardTable({
  data,
  competition,
  isIndividual,
  userEntityId,
  isRegistered,
  isLoggedIn
}: {
  data: any[];
  competition: any;
  isIndividual: boolean;
  userEntityId?: string;
  isRegistered: boolean;
  isLoggedIn: boolean;
}) {
  const metricInfo = SCORING_METRIC_INFO[competition.scoring_metric as keyof typeof SCORING_METRIC_INFO];
  const decimals = metricInfo?.decimals || 4;
  const isTeamCompetition = competition.participation_type === 'team';

  if (data.length === 0) {
    return (
      <div className="rounded-[10px] border border-border-default py-16 text-center text-sm text-text-tertiary">
        No submissions yet for the final leaderboard.
      </div>
    );
  }

  const rows: LeaderboardEntry[] = data.map((entry, index) => ({
    rank: index + 1,
    userId: isIndividual ? entry.entityId : undefined,
    teamId: isIndividual ? undefined : entry.entityId,
    userName: isIndividual
      ? entry.userName || entry.userEmail?.split('@')[0] || 'Anonymous'
      : entry.teamName || entry.userName || entry.userEmail?.split('@')[0] || 'Anonymous',
    teamName: isIndividual ? entry.teamName : undefined,
    publicScore: entry.publicScore,
    privateScore: entry.privateScore,
    averageScore: entry.average,
    totalSubmissions: entry.totalSubmissions,
    isCurrentUser: !!userEntityId && entry.entityId === userEntityId,
  }));

  return (
    <>
      <FinalScoreDistributionChart
        data={data}
        userEntityId={userEntityId}
        isRegistered={isRegistered}
        isLoggedIn={isLoggedIn}
        competition={competition}
      />
      <LeaderboardTable
        data={rows}
        variant="final"
        showTeam={isIndividual && isTeamCompetition}
        decimals={decimals}
        showWhen={false}
        emptyMessage="No submissions yet for the final leaderboard."
      />
    </>
  );
}

// Leaderboard Tab Component
function LeaderboardTab({
  leaderboard,
  finalLeaderboard,
  loading,
  competition,
  phase,
  onPhaseChange,
  userBestScore,
  userRank,
  isRegistered,
  isLoggedIn,
  userEntityId
}: {
  leaderboard: any[];
  finalLeaderboard: any[];
  loading: boolean;
  competition: any;
  phase: 'public' | 'private' | 'final';
  onPhaseChange: (phase: 'public' | 'private' | 'final') => void;
  userBestScore?: number;
  userRank?: number;
  isRegistered: boolean;
  isLoggedIn: boolean;
  userEntityId?: string;
}) {
  const is4Phase = competition.competition_type === '4-phase';
  const now = new Date();
  const privateTestStart = competition.private_test_start ? new Date(competition.private_test_start) : null;
  const privateTestEnd = competition.private_test_end ? new Date(competition.private_test_end) : null;
  const isPrivatePhaseStarted = privateTestStart && now >= privateTestStart;
  const isCompetitionEnded = privateTestEnd && now > privateTestEnd;

  const currentPhase = phase;
  const showPrivateNotStartedMessage = is4Phase && currentPhase === 'private' && !isPrivatePhaseStarted;

  // Show tabs based on competition phase
  const showFinalTab = is4Phase && !!isCompetitionEnded;
  const showPrivateTab = is4Phase && !!isPrivatePhaseStarted;

  // Extract scores for distribution chart
  const scores = leaderboard.map(entry => entry.score).filter((s): s is number => s !== null && s !== undefined);

  const metricInfo = SCORING_METRIC_INFO[competition.scoring_metric as keyof typeof SCORING_METRIC_INFO];
  const metricName = metricShortName(competition.scoring_metric);
  const decimals = metricInfo?.decimals || 4;
  const ascending = metricInfo?.higher_is_better === false;
  const arrow = ascending ? ' ↓' : ' ↑';

  const nav = is4Phase ? (
    <PhaseTabsNav
      phase={phase}
      onPhaseChange={onPhaseChange}
      showFinal={showFinalTab}
      showPrivate={showPrivateTab}
    />
  ) : null;

  if (loading) {
    return (
      <div>
        {nav}
        <div className="rounded-[10px] border border-border-default py-16 text-center text-sm text-text-tertiary">
          Loading leaderboard…
        </div>
      </div>
    );
  }

  if (showPrivateNotStartedMessage) {
    return (
      <div>
        {nav}
        <div className="rounded-[10px] border border-border-default py-16 text-center">
          <p className="text-sm font-bold text-text-secondary mb-1">Private phase not started</p>
          <p className="text-sm text-text-tertiary">
            The private test phase begins after the public phase ends.
            {privateTestStart &&
              ` Starts ${privateTestStart.toLocaleDateString()} at ${privateTestStart.toLocaleTimeString()}.`}
          </p>
        </div>
      </div>
    );
  }

  if (currentPhase === 'final') {
    return (
      <div>
        {nav}
        <FinalLeaderboardTable
          data={finalLeaderboard}
          competition={competition}
          isIndividual={false}
          userEntityId={userEntityId}
          isRegistered={isRegistered}
          isLoggedIn={isLoggedIn}
        />
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div>
        {nav}
        <div className="rounded-[10px] border border-border-default py-16 text-center text-sm text-text-tertiary">
          No submissions yet. Be the first to submit!
        </div>
      </div>
    );
  }

  const rows: LeaderboardEntry[] = leaderboard.map((entry, index) => ({
    rank: index + 1,
    userId: entry.user_id ?? undefined,
    teamId: entry.team_id ?? undefined,
    userName: entry.users?.full_name || entry.users?.email?.split('@')[0] || undefined,
    teamName: entry.teams?.name || undefined,
    score: entry.score,
    totalSubmissions: entry.submission_count || 0,
    lastSubmissionAt: entry.submitted_at,
    isCurrentUser:
      !!userEntityId && (entry.team_id === userEntityId || entry.user_id === userEntityId),
  }));

  return (
    <div>
      {nav}
      <ScoreDistributionChart
        scores={scores}
        userBestScore={userBestScore}
        userRank={userRank}
        isRegistered={isRegistered}
        isLoggedIn={isLoggedIn}
        totalParticipants={leaderboard.length}
        competition={competition}
      />
      <LeaderboardTable
        data={rows}
        variant="standard"
        metricLabel={`${metricName}${arrow}`}
        decimals={decimals}
        scoreAscending={ascending}
      />
    </div>
  );
}

// Individual Leaderboard Tab Component (for team competitions)
function IndividualLeaderboardTab({
  leaderboard,
  finalLeaderboard,
  loading,
  competition,
  phase,
  onPhaseChange,
  userBestScore,
  userRank,
  isRegistered,
  isLoggedIn,
  userId
}: {
  leaderboard: any[];
  finalLeaderboard: any[];
  loading: boolean;
  competition: any;
  phase: 'public' | 'private' | 'final';
  onPhaseChange: (phase: 'public' | 'private' | 'final') => void;
  userBestScore?: number;
  userRank?: number;
  isRegistered: boolean;
  isLoggedIn: boolean;
  userId?: string;
}) {
  const is4Phase = competition.competition_type === '4-phase';
  const now = new Date();
  const privateTestStart = competition.private_test_start ? new Date(competition.private_test_start) : null;
  const privateTestEnd = competition.private_test_end ? new Date(competition.private_test_end) : null;
  const isPrivatePhaseStarted = privateTestStart && now >= privateTestStart;
  const isCompetitionEnded = privateTestEnd && now > privateTestEnd;

  const currentPhase = phase;
  const showPrivateNotStartedMessage = is4Phase && currentPhase === 'private' && !isPrivatePhaseStarted;
  const showFinalTab = is4Phase && !!isCompetitionEnded;
  const showPrivateTab = is4Phase && !!isPrivatePhaseStarted;

  // Extract scores for distribution chart
  const scores = leaderboard.map(entry => entry.score).filter((s): s is number => s !== null && s !== undefined);

  const metricInfo = SCORING_METRIC_INFO[competition.scoring_metric as keyof typeof SCORING_METRIC_INFO];
  const metricName = metricShortName(competition.scoring_metric);
  const decimals = metricInfo?.decimals || 4;
  const ascending = metricInfo?.higher_is_better === false;

  const nav = is4Phase ? (
    <PhaseTabsNav
      phase={phase}
      onPhaseChange={onPhaseChange}
      showFinal={showFinalTab}
      showPrivate={showPrivateTab}
    />
  ) : null;

  if (loading) {
    return (
      <div>
        {nav}
        <div className="rounded-[10px] border border-border-default py-16 text-center text-sm text-text-tertiary">
          Loading individual leaderboard…
        </div>
      </div>
    );
  }

  if (showPrivateNotStartedMessage) {
    return (
      <div>
        {nav}
        <div className="rounded-[10px] border border-border-default py-16 text-center">
          <p className="text-sm font-bold text-text-secondary mb-1">Private phase not started</p>
          <p className="text-sm text-text-tertiary">
            The private test phase begins after the public phase ends.
            {privateTestStart &&
              ` Starts ${privateTestStart.toLocaleDateString()} at ${privateTestStart.toLocaleTimeString()}.`}
          </p>
        </div>
      </div>
    );
  }

  if (currentPhase === 'final') {
    return (
      <div>
        {nav}
        <FinalLeaderboardTable
          data={finalLeaderboard}
          competition={competition}
          isIndividual={true}
          userEntityId={userId}
          isRegistered={isRegistered}
          isLoggedIn={isLoggedIn}
        />
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div>
        {nav}
        <div className="rounded-[10px] border border-border-default py-16 text-center text-sm text-text-tertiary">
          No submissions yet. Individual members are ranked here by their contributions.
        </div>
      </div>
    );
  }

  const rows: LeaderboardEntry[] = leaderboard.map((entry, index) => ({
    rank: index + 1,
    userId: entry.submitted_by ?? undefined,
    userName: entry.users?.full_name || entry.users?.email?.split('@')[0] || undefined,
    teamName: entry.teams?.name || 'Unknown team',
    score: entry.score,
    totalSubmissions: entry.submission_count || 0,
    lastSubmissionAt: entry.submitted_at,
    isCurrentUser: !!userId && entry.submitted_by === userId,
  }));

  return (
    <div>
      {nav}
      <ScoreDistributionChart
        scores={scores}
        userBestScore={userBestScore}
        userRank={userRank}
        isRegistered={isRegistered}
        isLoggedIn={isLoggedIn}
        totalParticipants={leaderboard.length}
        competition={competition}
      />
      <LeaderboardTable
        data={rows}
        variant="standard"
        showTeam
        metricLabel={`${metricName}${ascending ? ' ↓' : ' ↑'}`}
        decimals={decimals}
        scoreAscending={ascending}
      />
    </div>
  );
}

// Submissions Tab Component
function SubmissionsTab({ submissions, loading, competition }: { submissions: any[]; loading: boolean; competition: any }) {
  const [phaseFilter, setPhaseFilter] = useState<'all' | 'public' | 'private'>('all');

  const is4Phase = competition.competition_type === '4-phase';

  // Filter submissions by phase
  const filteredSubmissions = phaseFilter === 'all'
    ? submissions
    : submissions.filter((sub: any) => sub.phase === phaseFilter);

  const phaseFilterNav = is4Phase ? (
    <div className="flex gap-5 mb-5 overflow-x-auto scrollbar-none">
      {([
        { value: 'all', label: 'All Phases' },
        { value: 'public', label: 'Public Phase' },
        { value: 'private', label: 'Private Phase' },
      ] as const).map(({ value, label }) => (
        <button
          key={value}
          onClick={() => setPhaseFilter(value)}
          className={`pb-1 text-sm font-bold whitespace-nowrap shrink-0 border-b-2 transition-colors ${
            phaseFilter === value
              ? 'border-primary-blue text-text-primary'
              : 'border-transparent text-text-tertiary hover:text-text-secondary'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  ) : null;

  if (loading) {
    return (
      <div>
        {phaseFilterNav}
        <div className="rounded-[10px] border border-border-default py-16 text-center text-sm text-text-tertiary">
          Loading submissions…
        </div>
      </div>
    );
  }

  if (filteredSubmissions.length === 0) {
    return (
      <div>
        {phaseFilterNav}
        <div className="rounded-[10px] border border-border-default py-16 text-center text-sm text-text-tertiary">
          No submissions yet{phaseFilter !== 'all' ? ` in the ${phaseFilter} phase` : ''}. Submit your first solution!
        </div>
      </div>
    );
  }

  return (
    <div>
      {phaseFilterNav}
      <div className="rounded-[10px] border border-border-default overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-bg-elevated">
              <tr>
                {(
                  [
                    ['File', 'left'],
                    ...(is4Phase ? ([['Phase', 'left']] as const) : []),
                    ['Status', 'left'],
                    ['Score', 'right'],
                    ['Submitted', 'right'],
                    ['Best', 'center'],
                  ] as const
                ).map(([label, align]) => (
                  <th
                    key={label}
                    className={`px-3.5 py-[9px] text-xs font-semibold uppercase tracking-[0.07em] text-text-tertiary whitespace-nowrap ${
                      align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
                    }`}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredSubmissions.map((submission) => {
                const status = submission.validation_status;
                return (
                  <tr
                    key={submission.id}
                    className="border-t border-border-default first:border-t-0 hover:bg-bg-elevated transition-colors"
                  >
                    <td className="px-3.5 py-[11px] max-w-[140px] sm:max-w-xs">
                      <span className="text-text-primary font-bold truncate block">
                        {submission.file_name}
                      </span>
                    </td>
                    {is4Phase && (
                      <td className="px-3.5 py-[11px]">
                        <span
                          className={`font-bold ${
                            submission.phase === 'public' ? 'text-[#60A5FA]' : 'text-[#22D3EE]'
                          }`}
                        >
                          {submission.phase === 'public' ? 'Public' : 'Private'}
                        </span>
                      </td>
                    )}
                    <td className="px-3.5 py-[11px]">
                      <span
                        className={`font-bold ${
                          status === 'valid'
                            ? 'text-[#34D399]'
                            : status === 'invalid'
                              ? 'text-[#F87171]'
                              : 'text-text-tertiary'
                        }`}
                      >
                        {status === 'valid' ? 'Valid' : status === 'invalid' ? 'Invalid' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-3.5 py-[11px] text-right">
                      {submission.score !== null ? (
                        <span className="font-mono font-bold text-[#60A5FA]">
                          {submission.score.toFixed(4)}
                        </span>
                      ) : (
                        <span className="text-text-tertiary">—</span>
                      )}
                    </td>
                    <td className="px-3.5 py-[11px] text-right">
                      <span className="font-mono text-xs text-text-tertiary whitespace-nowrap">
                        {new Date(submission.submitted_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-3.5 py-[11px] text-center">
                      {submission.is_best_score && (
                        <span className="font-mono text-xs font-bold text-[#FBBF24]">BEST</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
