import type { SupabaseClient } from '@supabase/supabase-js';
import { getCompetitionPhase, type CompetitionPhase } from '@/lib/utils/competition';
import { rankContest } from '@/lib/leaderboard';

export interface CompetitionSummary {
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
  min_team_size: number | null;
  max_team_size: number | null;
  daily_submission_limit: number;
  created_at: string;
  phase: CompetitionPhase;
  participants: number;
  submissions: number;
}

export interface PodiumEntry {
  rank: number;
  name: string;
  team?: string | null;
  score: number | null;
}

const COMPETITION_COLUMNS =
  'id, title, description, competition_type, participation_type, registration_start, registration_end, public_test_start, public_test_end, private_test_start, private_test_end, scoring_metric, min_team_size, max_team_size, daily_submission_limit, created_at';

/** All live (non-deleted) competitions with phase, participant and submission counts. */
export async function getCompetitionSummaries(supabase: SupabaseClient, now: Date = new Date()): Promise<CompetitionSummary[]> {
  const [{ data: comps }, { data: counts }] = await Promise.all([
    supabase.from('competitions').select(COMPETITION_COLUMNS).is('deleted_at', null).order('registration_start', { ascending: false }),
    supabase.from('competition_participant_counts').select('competition_id, participant_count'),
  ]);

  const list = (comps ?? []) as Omit<CompetitionSummary, 'phase' | 'participants' | 'submissions'>[];
  const participantMap = new Map<string, number>(
    ((counts ?? []) as { competition_id: string; participant_count: number }[]).map((c) => [c.competition_id, c.participant_count])
  );

  const subCounts = await Promise.all(
    list.map((c) => supabase.from('submissions').select('id', { count: 'exact', head: true }).eq('competition_id', c.id))
  );

  return list.map((c, i) => ({
    ...c,
    phase: getCompetitionPhase(c, now),
    participants: participantMap.get(c.id) ?? 0,
    submissions: subCounts[i].count ?? 0,
  }));
}

/** Top-N final standings for a competition, computed from valid submissions. */
export async function getPodium(supabase: SupabaseClient, c: Pick<CompetitionSummary, 'id' | 'participation_type' | 'competition_type' | 'scoring_metric'>, n = 3): Promise<PodiumEntry[]> {
  const isTeam = c.participation_type === 'team';
  const { data } = await supabase
    .from('submissions')
    .select('score, submitted_at, phase, user_id, team_id, teams!submissions_team_id_fkey(name), users!submissions_user_id_fkey(full_name)')
    .eq('competition_id', c.id)
    .eq('validation_status', 'valid');

  type Row = {
    score: number | null;
    submitted_at: string;
    phase: string;
    user_id: string | null;
    team_id: string | null;
    teams: { name: string } | { name: string }[] | null;
    users: { full_name: string | null } | { full_name: string | null }[] | null;
  };
  const rows = (data ?? []) as Row[];
  const one = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? v[0] ?? null : v);

  const ranked = rankContest(rows, (r) => (isTeam ? r.team_id : r.user_id), c.scoring_metric, c.competition_type === '4-phase');
  return ranked.slice(0, n).map((e) => ({
    rank: e.rank,
    name: isTeam ? one(e.sample.teams)?.name ?? 'Team' : one(e.sample.users)?.full_name ?? 'Participant',
    score: e.score,
  }));
}

/** The contest a visitor most needs to know about right now, if any. */
export function pickSpotlight(list: CompetitionSummary[]): CompetitionSummary | null {
  const order: CompetitionPhase[] = ['registration', 'public_test', 'private_test', 'upcoming'];
  for (const p of order) {
    const hit = list.filter((c) => c.phase === p).sort((a, b) => a.registration_start.localeCompare(b.registration_start))[0];
    if (hit) return hit;
  }
  return null;
}

/** Short code like "PAIC 2026" from "PAIC 2026 - PTNK AI Challenge 2026". */
export function splitTitle(title: string): { code: string | null; name: string } {
  const m = title.match(/^(.{2,24}?)\s+[-–—]\s+(.+)$/);
  return m ? { code: m[1].trim(), name: m[2].trim() } : { code: null, name: title };
}
