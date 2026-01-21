'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Trophy, FileText, History, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { SCORING_METRIC_INFO } from '@/lib/constants';

interface CompetitionTabsProps {
  competition: any;
  leaderboard: any[];
  isRegistered: boolean;
  userId?: string;
}

type TabType = 'overview' | 'leaderboard' | 'individual_leaderboard' | 'submissions';

export default function CompetitionTabs({
  competition,
  leaderboard: initialLeaderboard,
  isRegistered,
  userId
}: CompetitionTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
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

      // Then find which team belongs to this competition
      const teamIds = memberships.map((m: any) => m.team_id);
      const { data: teams } = await supabase
        .from('teams')
        .select('id')
        .eq('competition_id', competition.id)
        .in('id', teamIds)
        .limit(1);

      if (teams && teams.length > 0) {
        setUserTeamId((teams[0] as any).id);
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
      .select('*')
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

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: FileText },
    { id: 'leaderboard' as TabType, label: isTeamCompetition ? 'Team Leaderboard' : 'Leaderboard', icon: Trophy },
    ...(isTeamCompetition ? [{ id: 'individual_leaderboard' as TabType, label: 'Individual Leaderboard', icon: Trophy }] : []),
    ...(isRegistered ? [{ id: 'submissions' as TabType, label: 'My Submissions', icon: History }] : []),
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-border-default">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-6 py-3 font-semibold transition-all
                border-b-2 -mb-px
                ${activeTab === tab.id
                  ? 'border-primary-blue text-primary-blue'
                  : 'border-transparent text-text-tertiary hover:text-text-secondary'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
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

// Overview Tab Component
function OverviewTab({ competition }: { competition: any }) {
  return (
    <div className="space-y-6">
      {/* Problem Statement */}
      <Card className="p-6">
        <h3 className="text-2xl font-bold mb-4">Problem Statement</h3>
        <div className="prose prose-invert max-w-none">
          {competition.problem_statement ? (
            <div className="text-text-secondary whitespace-pre-wrap leading-relaxed">
              {competition.problem_statement}
            </div>
          ) : (
            <p className="text-text-tertiary">No problem statement provided yet.</p>
          )}
        </div>
      </Card>

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

  return (
    <div className="flex gap-2 mb-6 border-b border-border-default">
      {showFinal && (
        <button
          onClick={() => onPhaseChange('final')}
          className={`px-6 py-3 font-semibold transition-all border-b-2 -mb-px ${
            phase === 'final'
              ? 'border-warning text-warning'
              : 'border-transparent text-text-tertiary hover:text-text-secondary'
          }`}
        >
          Final
        </button>
      )}
      {showPrivate && (
        <button
          onClick={() => onPhaseChange('private')}
          className={`px-6 py-3 font-semibold transition-all border-b-2 -mb-px ${
            phase === 'private'
              ? 'border-primary-blue text-primary-blue'
              : 'border-transparent text-text-tertiary hover:text-text-secondary'
          }`}
        >
          Private Phase
        </button>
      )}
      <button
        onClick={() => onPhaseChange('public')}
        className={`px-6 py-3 font-semibold transition-all border-b-2 -mb-px ${
          phase === 'public'
            ? 'border-primary-blue text-primary-blue'
            : 'border-transparent text-text-tertiary hover:text-text-secondary'
        }`}
      >
        Public Phase
      </button>
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

  // Calculate median position for line indicator
  const mainBinsStartIndex = outlierCount.low > 0 ? 1 : 0;
  const mainBinsEndIndex = bins.length - (outlierCount.high > 0 ? 1 : 0);
  const medianPosition = focusMax !== focusMin
    ? ((median - focusMin) / (focusMax - focusMin)) * 100
    : 50;
  const medianInRange = median >= focusMin && median <= focusMax;

  return (
    <Card className="p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-secondary flex items-center gap-2">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3v18h18" />
            <path d="M7 16v-4" />
            <path d="M11 16v-8" />
            <path d="M15 16v-6" />
            <path d="M19 16v-10" />
          </svg>
          Score Distribution
          <span className="text-xs font-normal text-text-tertiary ml-2">
            {higherIsBetter ? '(Higher is better →)' : '(← Lower is better)'}
          </span>
        </h3>
        <div className="flex items-center gap-4 text-xs text-text-tertiary">
          <span>Participants: <span className="font-semibold text-text-secondary">{totalParticipants}</span></span>
          <span>Avg: <span className="font-mono font-semibold text-text-secondary">{avg.toFixed(decimals)}</span></span>
          <span>Median: <span className="font-mono font-semibold text-text-secondary">{median.toFixed(decimals)}</span></span>
        </div>
      </div>

      {/* Histogram */}
      <div className="relative flex items-end gap-1 mb-2" style={{ height: '120px' }}>
        {/* Median line indicator */}
        {medianInRange && (
          <div
            className="absolute bottom-0 top-0 w-0.5 bg-cyan-400 z-10 opacity-60"
            style={{
              left: `calc(${outlierCount.low > 0 ? '8% + ' : ''}${medianPosition * (outlierCount.low > 0 && outlierCount.high > 0 ? 0.84 : outlierCount.low > 0 || outlierCount.high > 0 ? 0.92 : 1)}%)`
            }}
            title={`Median: ${median.toFixed(decimals)}`}
          />
        )}

        {bins.map((bin, index) => {
          const heightPercent = maxCount > 0 ? (bin.count / maxCount) * 100 : 0;
          const isHovered = hoveredBar === index;
          const displayHeight = bin.count > 0 ? Math.max(heightPercent, 6) : 0;
          const heightPx = (displayHeight / 100) * 120;
          const isOutlierBin = bin.isOutlier;

          return (
            <div
              key={index}
              className={`relative group cursor-pointer ${isOutlierBin ? 'flex-[0.5]' : 'flex-1'}`}
              style={{ minWidth: isOutlierBin ? '24px' : '12px' }}
              onMouseEnter={() => setHoveredBar(index)}
              onMouseLeave={() => setHoveredBar(null)}
            >
              <div
                className={`
                  w-full rounded-t-sm transition-all duration-200
                  ${bin.hasUser
                    ? 'bg-gradient-to-t from-warning to-yellow-400'
                    : isOutlierBin
                      ? 'bg-gradient-to-t from-slate-500 to-slate-400'
                      : 'bg-gradient-to-t from-primary-blue to-cyan-400'
                  }
                  ${isHovered ? 'opacity-100' : 'opacity-80'}
                `}
                style={{ height: `${heightPx}px` }}
              />

              {/* Tooltip */}
              {isHovered && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 whitespace-nowrap">
                  <div className="bg-bg-primary border border-border-default rounded-lg px-3 py-2 shadow-lg">
                    <div className="text-xs font-mono text-text-secondary">
                      {isOutlierBin ? (
                        index === 0 && outlierCount.low > 0 ? `< ${focusMin.toFixed(2)} (outliers)` : `> ${focusMax.toFixed(2)} (outliers)`
                      ) : (
                        `${bin.min.toFixed(2)} - ${bin.max.toFixed(2)}`
                      )}
                    </div>
                    <div className="text-sm font-semibold text-text-primary">
                      {bin.count} {bin.count === 1 ? 'participant' : 'participants'}
                    </div>
                    {bin.hasUser && (
                      <div className="text-xs text-warning font-medium mt-1">
                        Your score is here
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between text-xs text-text-tertiary font-mono px-1">
        <span>{sortedScores[0].toFixed(2)}</span>
        <span className="text-cyan-400">{median.toFixed(2)}</span>
        <span>{sortedScores[sortedScores.length - 1].toFixed(2)}</span>
      </div>

      {/* User position info */}
      <div className="mt-4 pt-4 border-t border-border-default">
        {isLoggedIn && isRegistered ? (
          userBestScore !== undefined ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center">
                  <Trophy className="w-4 h-4 text-warning" />
                </div>
                <div>
                  <div className="text-xs text-text-tertiary">Your Best Score</div>
                  <div className="font-mono font-bold text-warning">{userBestScore.toFixed(decimals)}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-text-tertiary">Your Rank</div>
                <div className="font-bold text-text-primary">
                  #{userRank} <span className="text-text-tertiary font-normal">/ {totalParticipants}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-text-tertiary">
                  {higherIsBetter ? 'Behind Leader' : 'Above Leader'}
                </div>
                <div className="font-mono text-sm text-text-secondary">
                  {higherIsBetter
                    ? (sortedScores[sortedScores.length - 1] - userBestScore).toFixed(decimals)
                    : (userBestScore - sortedScores[0]).toFixed(decimals)
                  }
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-text-tertiary">
              <div className="w-8 h-8 rounded-full bg-bg-elevated flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm">You haven't submitted yet</div>
                <div className="text-xs">Submit your solution to see your position!</div>
              </div>
            </div>
          )
        ) : isLoggedIn ? (
          <div className="flex items-center gap-3 text-text-tertiary">
            <div className="w-8 h-8 rounded-full bg-bg-elevated flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm">Register to participate</div>
              <div className="text-xs">Join this competition to submit your solution!</div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-text-tertiary">
            <div className="w-8 h-8 rounded-full bg-bg-elevated flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm">Login to participate</div>
              <div className="text-xs">Create an account or login to join this competition!</div>
            </div>
          </div>
        )}
      </div>
    </Card>
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

  // Calculate median position for line indicator
  const medianPosition = focusMax !== focusMin
    ? ((median - focusMin) / (focusMax - focusMin)) * 100
    : 50;
  const medianInRange = median >= focusMin && median <= focusMax;

  return (
    <Card className="p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-secondary flex items-center gap-2">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3v18h18" />
            <path d="M7 16v-4" />
            <path d="M11 16v-8" />
            <path d="M15 16v-6" />
            <path d="M19 16v-10" />
          </svg>
          Final Score Distribution (Average)
          <span className="text-xs font-normal text-text-tertiary ml-2">
            {higherIsBetter ? '(Higher is better →)' : '(← Lower is better)'}
          </span>
        </h3>
        <div className="flex items-center gap-4 text-xs text-text-tertiary">
          <span>Complete: <span className="font-semibold text-text-secondary">{entriesWithAverage.length}</span></span>
          <span>Avg: <span className="font-mono font-semibold text-text-secondary">{avg.toFixed(decimals)}</span></span>
          <span>Median: <span className="font-mono font-semibold text-text-secondary">{median.toFixed(decimals)}</span></span>
        </div>
      </div>

      {/* Histogram */}
      <div className="relative flex items-end gap-1 mb-2" style={{ height: '120px' }}>
        {/* Median line indicator */}
        {medianInRange && (
          <div
            className="absolute bottom-0 top-0 w-0.5 bg-cyan-400 z-10 opacity-60"
            style={{
              left: `calc(${outlierCount.low > 0 ? '8% + ' : ''}${medianPosition * (outlierCount.low > 0 && outlierCount.high > 0 ? 0.84 : outlierCount.low > 0 || outlierCount.high > 0 ? 0.92 : 1)}%)`
            }}
            title={`Median: ${median.toFixed(decimals)}`}
          />
        )}

        {bins.map((bin, index) => {
          const heightPercent = maxCount > 0 ? (bin.count / maxCount) * 100 : 0;
          const isHovered = hoveredBar === index;
          const displayHeight = bin.count > 0 ? Math.max(heightPercent, 6) : 0;
          const heightPx = (displayHeight / 100) * 120;
          const isOutlierBin = bin.isOutlier;

          return (
            <div
              key={index}
              className={`relative group cursor-pointer ${isOutlierBin ? 'flex-[0.5]' : 'flex-1'}`}
              style={{ minWidth: isOutlierBin ? '24px' : '12px' }}
              onMouseEnter={() => setHoveredBar(index)}
              onMouseLeave={() => setHoveredBar(null)}
            >
              <div
                className={`
                  w-full rounded-t-sm transition-all duration-200
                  ${bin.hasUser
                    ? 'bg-gradient-to-t from-warning to-yellow-400'
                    : isOutlierBin
                      ? 'bg-gradient-to-t from-slate-500 to-slate-400'
                      : 'bg-gradient-to-t from-primary-blue to-cyan-400'
                  }
                  ${isHovered ? 'opacity-100' : 'opacity-80'}
                `}
                style={{ height: `${heightPx}px` }}
              />

              {isHovered && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 whitespace-nowrap">
                  <div className="bg-bg-primary border border-border-default rounded-lg px-3 py-2 shadow-lg">
                    <div className="text-xs font-mono text-text-secondary">
                      {isOutlierBin ? (
                        index === 0 && outlierCount.low > 0 ? `< ${focusMin.toFixed(2)} (outliers)` : `> ${focusMax.toFixed(2)} (outliers)`
                      ) : (
                        `${bin.min.toFixed(2)} - ${bin.max.toFixed(2)}`
                      )}
                    </div>
                    <div className="text-sm font-semibold text-text-primary">
                      {bin.count} {bin.count === 1 ? 'participant' : 'participants'}
                    </div>
                    {bin.hasUser && (
                      <div className="text-xs text-warning font-medium mt-1">Your average is here</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-between text-xs text-text-tertiary font-mono px-1">
        <span>{sortedScores[0].toFixed(2)}</span>
        <span className="text-cyan-400">{median.toFixed(2)}</span>
        <span>{sortedScores[sortedScores.length - 1].toFixed(2)}</span>
      </div>

      {/* User position info */}
      <div className="mt-4 pt-4 border-t border-border-default">
        {isLoggedIn && isRegistered ? (
          userAverage !== undefined && userAverage !== null ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center">
                  <Trophy className="w-4 h-4 text-warning" />
                </div>
                <div>
                  <div className="text-xs text-text-tertiary">Your Final Average</div>
                  <div className="font-mono font-bold text-warning">{userAverage.toFixed(decimals)}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-text-tertiary">Final Rank</div>
                <div className="font-bold text-text-primary">
                  #{userRank} <span className="text-text-tertiary font-normal">/ {entriesWithAverage.length}</span>
                </div>
              </div>
            </div>
          ) : userEntry ? (
            <div className="flex items-center gap-3 text-text-tertiary">
              <div className="w-8 h-8 rounded-full bg-bg-elevated flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm">Missing scores for final ranking</div>
                <div className="text-xs">You need both public and private scores for final ranking</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-text-tertiary">
              <div className="w-8 h-8 rounded-full bg-bg-elevated flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm">You didn't participate</div>
                <div className="text-xs">No submissions found for this competition</div>
              </div>
            </div>
          )
        ) : isLoggedIn ? (
          <div className="flex items-center gap-3 text-text-tertiary">
            <div className="w-8 h-8 rounded-full bg-bg-elevated flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm">You weren't registered</div>
              <div className="text-xs">This competition has ended</div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-text-tertiary">
            <div className="w-8 h-8 rounded-full bg-bg-elevated flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm">Login to see your results</div>
              <div className="text-xs">If you participated, login to view your final ranking</div>
            </div>
          </div>
        )}
      </div>
    </Card>
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
      <Card className="p-12">
        <div className="text-center text-text-tertiary">
          <Trophy className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No submissions yet for the final leaderboard.</p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <FinalScoreDistributionChart
        data={data}
        userEntityId={userEntityId}
        isRegistered={isRegistered}
        isLoggedIn={isLoggedIn}
        competition={competition}
      />
      <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-bg-elevated border-b border-border-default">
            <tr>
              <th className="px-4 py-4 text-left text-sm font-semibold text-text-secondary">Rank</th>
              <th className="px-4 py-4 text-left text-sm font-semibold text-text-secondary">
                {isIndividual ? 'Member' : (isTeamCompetition ? 'Team' : 'Participant')}
              </th>
              {isIndividual && isTeamCompetition && (
                <th className="px-4 py-4 text-left text-sm font-semibold text-text-secondary">Team</th>
              )}
              <th className="px-4 py-4 text-center text-sm font-semibold text-text-secondary">Public</th>
              <th className="px-4 py-4 text-center text-sm font-semibold text-text-secondary">Private</th>
              <th className="px-4 py-4 text-center text-sm font-semibold text-text-secondary">Average</th>
              <th className="px-4 py-4 text-center text-sm font-semibold text-text-secondary">Submissions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default">
            {data.map((entry, index) => (
              <tr
                key={entry.entityId}
                className={`
                  transition-colors hover:bg-bg-elevated
                  ${index === 0 ? 'bg-warning/5' : ''}
                  ${index === 1 ? 'bg-text-secondary/5' : ''}
                  ${index === 2 ? 'bg-phase-registration/5' : ''}
                  ${!entry.hasBoth ? 'opacity-70' : ''}
                `}
              >
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <span className={`
                      font-bold text-lg
                      ${index === 0 ? 'text-warning' : ''}
                      ${index === 1 ? 'text-text-secondary' : ''}
                      ${index === 2 ? 'text-phase-registration' : ''}
                      ${index > 2 ? 'text-text-tertiary' : ''}
                    `}>
                      #{index + 1}
                    </span>
                    {index < 3 && <Trophy className="w-4 h-4" />}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className="font-medium">
                    {isIndividual
                      ? (entry.userName || entry.userEmail?.split('@')[0] || 'Anonymous')
                      : (entry.teamName || entry.userName || entry.userEmail?.split('@')[0] || 'Anonymous')
                    }
                  </span>
                </td>
                {isIndividual && isTeamCompetition && (
                  <td className="px-4 py-4">
                    <span className="text-sm text-text-tertiary">
                      {entry.teamName || '—'}
                    </span>
                  </td>
                )}
                <td className="px-4 py-4 text-center">
                  {entry.publicScore !== null ? (
                    <span className="font-mono font-bold text-phase-public">
                      {entry.publicScore.toFixed(decimals)}
                    </span>
                  ) : (
                    <span className="text-text-tertiary">—</span>
                  )}
                </td>
                <td className="px-4 py-4 text-center">
                  {entry.privateScore !== null ? (
                    <span className="font-mono font-bold text-phase-private">
                      {entry.privateScore.toFixed(decimals)}
                    </span>
                  ) : (
                    <span className="text-text-tertiary">—</span>
                  )}
                </td>
                <td className="px-4 py-4 text-center">
                  {entry.average !== null ? (
                    <span className="font-mono font-bold text-warning">
                      {entry.average.toFixed(decimals)}
                    </span>
                  ) : (
                    <span className="text-text-tertiary">—</span>
                  )}
                </td>
                <td className="px-4 py-4 text-center">
                  <span className="text-sm text-text-tertiary">
                    {entry.totalSubmissions}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
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

  if (loading) {
    return (
      <div>
        {is4Phase && <PhaseTabsNav phase={phase} onPhaseChange={onPhaseChange} showFinal={showFinalTab} showPrivate={showPrivateTab} />}
        <Card className="p-12">
          <div className="text-center text-text-tertiary">Loading leaderboard...</div>
        </Card>
      </div>
    );
  }

  if (showPrivateNotStartedMessage) {
    return (
      <div>
        {is4Phase && <PhaseTabsNav phase={phase} onPhaseChange={onPhaseChange} showFinal={showFinalTab} showPrivate={showPrivateTab} />}
        <Card className="p-12">
          <div className="text-center">
            <Clock className="w-12 h-12 mx-auto mb-4 text-text-tertiary opacity-30" />
            <p className="text-lg font-semibold text-text-secondary mb-2">Private Phase Not Started</p>
            <p className="text-text-tertiary">
              The private test phase will start after the public phase ends.
            </p>
            {privateTestStart && (
              <p className="text-sm text-text-tertiary mt-2">
                Starts: {privateTestStart.toLocaleDateString()} at {privateTestStart.toLocaleTimeString()}
              </p>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // Show Final leaderboard
  if (currentPhase === 'final') {
    return (
      <div>
        {is4Phase && <PhaseTabsNav phase={phase} onPhaseChange={onPhaseChange} showFinal={showFinalTab} showPrivate={showPrivateTab} />}
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
        {is4Phase && <PhaseTabsNav phase={phase} onPhaseChange={onPhaseChange} showFinal={showFinalTab} showPrivate={showPrivateTab} />}
        <Card className="p-12">
          <div className="text-center text-text-tertiary">
            <Trophy className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No submissions yet. Be the first to submit!</p>
          </div>
        </Card>
      </div>
    );
  }

  const metricInfo = SCORING_METRIC_INFO[competition.scoring_metric as keyof typeof SCORING_METRIC_INFO];
  const metricName = metricInfo?.name || 'Score';
  const decimals = metricInfo?.decimals || 4;
  const isTeamCompetition = competition.participation_type === 'team';

  return (
    <div>
      {is4Phase && <PhaseTabsNav phase={phase} onPhaseChange={onPhaseChange} showFinal={showFinalTab} showPrivate={showPrivateTab} />}

      {/* Score Distribution Chart */}
      <ScoreDistributionChart
        scores={scores}
        userBestScore={userBestScore}
        userRank={userRank}
        isRegistered={isRegistered}
        isLoggedIn={isLoggedIn}
        totalParticipants={leaderboard.length}
        competition={competition}
      />
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
          <thead className="bg-bg-elevated border-b border-border-default">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">Rank</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">
                {isTeamCompetition ? 'Team' : 'Participant'}
              </th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-text-secondary">Submissions</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-text-secondary">
                {metricName}
                {metricInfo?.higher_is_better === false && ' ↓'}
                {metricInfo?.higher_is_better === true && ' ↑'}
              </th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-text-secondary">Submitted</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default">
            {leaderboard.map((entry, index) => (
              <tr
                key={entry.id}
                className={`
                  transition-colors hover:bg-bg-elevated
                  ${index === 0 ? 'bg-warning/5' : ''}
                  ${index === 1 ? 'bg-text-secondary/5' : ''}
                  ${index === 2 ? 'bg-phase-registration/5' : ''}
                `}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className={`
                      font-bold text-lg
                      ${index === 0 ? 'text-warning' : ''}
                      ${index === 1 ? 'text-text-secondary' : ''}
                      ${index === 2 ? 'text-phase-registration' : ''}
                      ${index > 2 ? 'text-text-tertiary' : ''}
                    `}>
                      #{index + 1}
                    </span>
                    {index < 3 && <Trophy className="w-4 h-4" />}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="font-medium">
                    {entry.teams?.name || entry.users?.full_name || entry.users?.email?.split('@')[0] || 'Anonymous'}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="text-sm text-text-tertiary">
                    {entry.submission_count || 0}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="font-mono font-bold text-primary-blue">
                    {entry.score?.toFixed(decimals) || '0.0000'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-sm text-text-tertiary">
                  {new Date(entry.submitted_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
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

  if (loading) {
    return (
      <div>
        {is4Phase && <PhaseTabsNav phase={phase} onPhaseChange={onPhaseChange} showFinal={showFinalTab} showPrivate={showPrivateTab} />}
        <Card className="p-12">
          <div className="text-center text-text-tertiary">Loading individual leaderboard...</div>
        </Card>
      </div>
    );
  }

  if (showPrivateNotStartedMessage) {
    return (
      <div>
        {is4Phase && <PhaseTabsNav phase={phase} onPhaseChange={onPhaseChange} showFinal={showFinalTab} showPrivate={showPrivateTab} />}
        <Card className="p-12">
          <div className="text-center">
            <Clock className="w-12 h-12 mx-auto mb-4 text-text-tertiary opacity-30" />
            <p className="text-lg font-semibold text-text-secondary mb-2">Private Phase Not Started</p>
            <p className="text-text-tertiary">
              The private test phase will start after the public phase ends.
            </p>
            {privateTestStart && (
              <p className="text-sm text-text-tertiary mt-2">
                Starts: {privateTestStart.toLocaleDateString()} at {privateTestStart.toLocaleTimeString()}
              </p>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // Show Final leaderboard
  if (currentPhase === 'final') {
    return (
      <div>
        {is4Phase && <PhaseTabsNav phase={phase} onPhaseChange={onPhaseChange} showFinal={showFinalTab} showPrivate={showPrivateTab} />}
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
        {is4Phase && <PhaseTabsNav phase={phase} onPhaseChange={onPhaseChange} showFinal={showFinalTab} showPrivate={showPrivateTab} />}
        <Card className="p-12">
          <div className="text-center text-text-tertiary">
            <Trophy className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No submissions yet. Individual members will be ranked here based on their contributions.</p>
          </div>
        </Card>
      </div>
    );
  }

  const metricInfo = SCORING_METRIC_INFO[competition.scoring_metric as keyof typeof SCORING_METRIC_INFO];
  const metricName = metricInfo?.name || 'Score';
  const decimals = metricInfo?.decimals || 4;

  return (
    <div>
      {is4Phase && <PhaseTabsNav phase={phase} onPhaseChange={onPhaseChange} showFinal={showFinalTab} showPrivate={showPrivateTab} />}

      {/* Score Distribution Chart */}
      <ScoreDistributionChart
        scores={scores}
        userBestScore={userBestScore}
        userRank={userRank}
        isRegistered={isRegistered}
        isLoggedIn={isLoggedIn}
        totalParticipants={leaderboard.length}
        competition={competition}
      />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-bg-elevated border-b border-border-default">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">Rank</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">Member</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">Team</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-text-secondary">Submissions</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-text-secondary">
                  {metricName}
                  {metricInfo?.higher_is_better === false && ' ↓'}
                  {metricInfo?.higher_is_better === true && ' ↑'}
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-text-secondary">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {leaderboard.map((entry, index) => (
                <tr
                  key={entry.id}
                  className={`
                    transition-colors hover:bg-bg-elevated
                    ${index === 0 ? 'bg-warning/5' : ''}
                    ${index === 1 ? 'bg-text-secondary/5' : ''}
                    ${index === 2 ? 'bg-phase-registration/5' : ''}
                  `}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`
                        font-bold text-lg
                        ${index === 0 ? 'text-warning' : ''}
                        ${index === 1 ? 'text-text-secondary' : ''}
                        ${index === 2 ? 'text-phase-registration' : ''}
                        ${index > 2 ? 'text-text-tertiary' : ''}
                      `}>
                        #{index + 1}
                      </span>
                      {index < 3 && <Trophy className="w-4 h-4" />}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium">
                      {entry.users?.full_name || entry.users?.email?.split('@')[0] || 'Anonymous'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-text-tertiary">
                      {entry.teams?.name || 'Unknown Team'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-sm text-text-tertiary">
                      {entry.submission_count || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-mono font-bold text-primary-blue">
                      {entry.score?.toFixed(decimals) || '0.0000'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-text-tertiary">
                    {new Date(entry.submitted_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
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
  if (loading) {
    return (
      <div>
        {is4Phase && (
          <div className="flex gap-2 mb-6 border-b border-border-default">
            <button
              onClick={() => setPhaseFilter('all')}
              className={`px-6 py-3 font-semibold transition-all border-b-2 -mb-px ${
                phaseFilter === 'all'
                  ? 'border-primary-blue text-primary-blue'
                  : 'border-transparent text-text-tertiary hover:text-text-secondary'
              }`}
            >
              All Phases
            </button>
            <button
              onClick={() => setPhaseFilter('public')}
              className={`px-6 py-3 font-semibold transition-all border-b-2 -mb-px ${
                phaseFilter === 'public'
                  ? 'border-primary-blue text-primary-blue'
                  : 'border-transparent text-text-tertiary hover:text-text-secondary'
              }`}
            >
              Public Phase
            </button>
            <button
              onClick={() => setPhaseFilter('private')}
              className={`px-6 py-3 font-semibold transition-all border-b-2 -mb-px ${
                phaseFilter === 'private'
                  ? 'border-primary-blue text-primary-blue'
                  : 'border-transparent text-text-tertiary hover:text-text-secondary'
              }`}
            >
              Private Phase
            </button>
          </div>
        )}
        <Card className="p-12">
          <div className="text-center text-text-tertiary">Loading submissions...</div>
        </Card>
      </div>
    );
  }

  if (filteredSubmissions.length === 0) {
    return (
      <div>
        {is4Phase && (
          <div className="flex gap-2 mb-6 border-b border-border-default">
            <button
              onClick={() => setPhaseFilter('all')}
              className={`px-6 py-3 font-semibold transition-all border-b-2 -mb-px ${
                phaseFilter === 'all'
                  ? 'border-primary-blue text-primary-blue'
                  : 'border-transparent text-text-tertiary hover:text-text-secondary'
              }`}
            >
              All Phases
            </button>
            <button
              onClick={() => setPhaseFilter('public')}
              className={`px-6 py-3 font-semibold transition-all border-b-2 -mb-px ${
                phaseFilter === 'public'
                  ? 'border-primary-blue text-primary-blue'
                  : 'border-transparent text-text-tertiary hover:text-text-secondary'
              }`}
            >
              Public Phase
            </button>
            <button
              onClick={() => setPhaseFilter('private')}
              className={`px-6 py-3 font-semibold transition-all border-b-2 -mb-px ${
                phaseFilter === 'private'
                  ? 'border-primary-blue text-primary-blue'
                  : 'border-transparent text-text-tertiary hover:text-text-secondary'
              }`}
            >
              Private Phase
            </button>
          </div>
        )}
        <Card className="p-12">
          <div className="text-center text-text-tertiary">
            <History className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No submissions yet{phaseFilter !== 'all' ? ` in ${phaseFilter} phase` : ''}. Submit your first solution!</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div>
      {is4Phase && (
        <div className="flex gap-2 mb-6 border-b border-border-default">
          <button
            onClick={() => setPhaseFilter('all')}
            className={`px-6 py-3 font-semibold transition-all border-b-2 -mb-px ${
              phaseFilter === 'all'
                ? 'border-primary-blue text-primary-blue'
                : 'border-transparent text-text-tertiary hover:text-text-secondary'
            }`}
          >
            All Phases
          </button>
          <button
            onClick={() => setPhaseFilter('public')}
            className={`px-6 py-3 font-semibold transition-all border-b-2 -mb-px ${
              phaseFilter === 'public'
                ? 'border-primary-blue text-primary-blue'
                : 'border-transparent text-text-tertiary hover:text-text-secondary'
            }`}
          >
            Public Phase
          </button>
          <button
            onClick={() => setPhaseFilter('private')}
            className={`px-6 py-3 font-semibold transition-all border-b-2 -mb-px ${
              phaseFilter === 'private'
                ? 'border-primary-blue text-primary-blue'
                : 'border-transparent text-text-tertiary hover:text-text-secondary'
            }`}
          >
            Private Phase
          </button>
        </div>
      )}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-bg-elevated border-b border-border-default">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">File</th>
                {is4Phase && <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">Phase</th>}
                <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">Status</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-text-secondary">Score</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-text-secondary">Submitted</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-text-secondary">Best</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {filteredSubmissions.map((submission) => (
              <tr key={submission.id} className="transition-colors hover:bg-bg-elevated">
                <td className="px-6 py-4">
                  <span className="font-medium text-sm">{submission.file_name}</span>
                </td>
                {is4Phase && (
                  <td className="px-6 py-4">
                    <Badge variant={submission.phase === 'public' ? 'blue' : 'cyan'}>
                      {submission.phase === 'public' ? 'Public' : 'Private'}
                    </Badge>
                  </td>
                )}
                <td className="px-6 py-4">
                  <Badge
                    variant={
                      submission.validation_status === 'valid' ? 'success' :
                      submission.validation_status === 'invalid' ? 'danger' :
                      'secondary'
                    }
                  >
                    {submission.validation_status}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-right">
                  {submission.score !== null ? (
                    <span className="font-mono font-bold text-primary-blue">
                      {submission.score.toFixed(4)}
                    </span>
                  ) : (
                    <span className="text-text-tertiary">-</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 text-sm text-text-tertiary">
                    <Clock className="w-4 h-4" />
                    {new Date(submission.submitted_at).toLocaleString()}
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  {submission.is_best_score && (
                    <Trophy className="w-5 h-5 text-warning mx-auto" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
    </div>
  );
}
