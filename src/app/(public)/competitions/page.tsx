import { createClient } from '@/lib/supabase/server';
import { getCompetitionPhase, getCountdown, type CompetitionPhase } from '@/lib/utils/competition';
import { SCORING_METRIC_INFO } from '@/lib/constants';
import CompetitionsClient, { type CompetitionWithStats, type Competition } from './CompetitionsClient';

export const metadata = {
  title: 'Competitions – The Noders',
  description: 'Active challenges and past results from the Noders PTNK community.',
};

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

export default async function CompetitionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch all base competition data in parallel on the server
  const [
    { data: competitionsData, error: competitionsError },
    { data: participantCountsData },
    { data: submissionsData },
    { data: bestScoresData },
    { data: teamRegistrationsData },
  ] = await Promise.all([
    supabase
      .from('competitions')
      .select('id, title, description, competition_type, participation_type, registration_start, registration_end, public_test_start, public_test_end, private_test_start, private_test_end, scoring_metric, created_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
    supabase
      .from('competition_participant_counts')
      .select('competition_id, participant_count'),
    supabase
      .from('submissions')
      .select('competition_id'),
    supabase
      .from('submissions')
      .select('competition_id, score, phase, user_id, team_id, users!submissions_user_id_fkey(full_name), teams!submissions_team_id_fkey(name)')
      .eq('is_best_score', true)
      .eq('validation_status', 'valid')
      .not('score', 'is', null),
    supabase
      .from('registrations')
      .select('competition_id, team_id, status')
      .not('team_id', 'is', null)
      .eq('status', 'approved'),
  ]);

  if (competitionsError || !competitionsData) {
    return <CompetitionsClient initialCompetitions={[]} initialUserId={user?.id || null} />;
  }

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

  // Fetch user's registration status if logged in
  let userRegistrations: Record<string, string> = {};
  if (user?.id) {
    const [
      { data: individualRegsData },
      { data: teamMemberships },
    ] = await Promise.all([
      supabase.from('registrations').select('competition_id, status').eq('user_id', user.id),
      supabase.from('team_members').select('team_id').eq('user_id', user.id),
    ]);

    let teamRegsData: any[] = [];
    if (teamMemberships && teamMemberships.length > 0) {
      const teamIds = teamMemberships.map((m: any) => m.team_id);
      const { data: teamRegs } = await supabase
        .from('registrations')
        .select('competition_id, status')
        .in('team_id', teamIds);
      teamRegsData = teamRegs || [];
    }

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
      registration_status: user?.id
        ? (userRegistrations[comp.id] as any) || 'not_registered'
        : undefined,
      countdown,
    };
  });

  return (
    <CompetitionsClient
      initialCompetitions={processedCompetitions}
      initialUserId={user?.id || null}
    />
  );
}
