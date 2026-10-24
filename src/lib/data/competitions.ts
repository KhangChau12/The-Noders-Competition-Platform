import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createPublicClient } from '@/lib/supabase/public';
import { getCompetitionPhase, type CompetitionPhase } from '@/lib/utils/competition';
import { rankContest } from '@/lib/leaderboard';

/*
 * Public contest data is the same for every visitor, so it is cached on the
 * server (anonymous client, no cookies) instead of being re-read from Supabase
 * on every request. Admin mutations call revalidateTag(CONTEST_TAG) so edits
 * show up at once; scores come from the Edge Function, so boards simply refresh
 * on a short timer.
 */
export const CONTEST_TAG = 'contests';
const LIST_TTL = 60;
const LIVE_BOARD_TTL = 60;
const ENDED_BOARD_TTL = 3600;

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

type CompetitionRow = Omit<CompetitionSummary, 'phase' | 'participants' | 'submissions'>;

const listRaw = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const [{ data: comps }, { data: counts }] = await Promise.all([
      supabase.from('competitions').select(COMPETITION_COLUMNS).is('deleted_at', null).order('registration_start', { ascending: false }),
      supabase.from('competition_participant_counts').select('competition_id, participant_count'),
    ]);
    const list = (comps ?? []) as CompetitionRow[];
    const subCounts = await Promise.all(list.map((c) => supabase.from('submissions').select('id', { count: 'exact', head: true }).eq('competition_id', c.id)));
    const participants = Object.fromEntries(((counts ?? []) as { competition_id: string; participant_count: number }[]).map((c) => [c.competition_id, c.participant_count]));
    return list.map((c, i) => ({ ...c, participants: participants[c.id] ?? 0, submissions: subCounts[i].count ?? 0 }));
  },
  ['contest-list-v1'],
  { revalidate: LIST_TTL, tags: [CONTEST_TAG] }
);

/** All live (non-deleted) competitions with phase, participant and submission counts. Phase is computed per request. */
export async function getCompetitionSummaries(_supabase?: SupabaseClient, now: Date = new Date()): Promise<CompetitionSummary[]> {
  const list = await listRaw();
  return list.map((c) => ({ ...c, phase: getCompetitionPhase(c, now) }));
}

/** Distinct people who ever took part (view), cached with the contest list. */
export const getTotalParticipants = unstable_cache(
  async () => {
    const { data } = await createPublicClient().from('total_participants_count').select('total_count').maybeSingle();
    return (data as { total_count: number } | null)?.total_count ?? null;
  },
  ['total-participants-v1'],
  { revalidate: LIST_TTL, tags: [CONTEST_TAG] }
);

/** One contest by id, cached; shared by generateMetadata and the page (React cache dedupes within a request). */
export const getCompetitionById = cache((id: string) =>
  unstable_cache(
    async () => {
      const { data } = await createPublicClient()
        .from('competitions')
        .select(
          'id, title, description, problem_statement, competition_type, participation_type, registration_start, registration_end, public_test_start, public_test_end, private_test_start, private_test_end, daily_submission_limit, total_submission_limit, max_file_size_mb, min_team_size, max_team_size, scoring_metric, dataset_url, sample_submission_url'
        )
        .eq('id', id)
        .is('deleted_at', null)
        .maybeSingle();
      return data as Record<string, any> | null;
    },
    ['contest-by-id-v1', id],
    { revalidate: LIST_TTL, tags: [CONTEST_TAG] }
  )()
);

export interface BoardRowRaw {
  score: number | null;
  submitted_at: string;
  phase: string;
  user_id: string | null;
  team_id: string | null;
  submitted_by: string | null;
  users: unknown;
  teams: unknown;
  submitter: unknown;
}

async function fetchBoardRows(id: string) {
  const supabase = createPublicClient();
  const [{ data }, { data: pc }, { count }] = await Promise.all([
    supabase
      .from('submissions')
      .select('score, submitted_at, phase, user_id, team_id, submitted_by, users!submissions_user_id_fkey(full_name), teams!submissions_team_id_fkey(name), submitter:users!submissions_submitted_by_fkey(full_name)')
      .eq('competition_id', id)
      .eq('validation_status', 'valid'),
    supabase.from('competition_participant_counts').select('participant_count').eq('competition_id', id).maybeSingle(),
    supabase.from('submissions').select('id', { count: 'exact', head: true }).eq('competition_id', id),
  ]);
  return { rows: (data ?? []) as BoardRowRaw[], participants: (pc as { participant_count: number } | null)?.participant_count ?? 0, submissions: count ?? 0 };
}

const boardLive = (id: string) => unstable_cache(() => fetchBoardRows(id), ['contest-board-v1', id], { revalidate: LIVE_BOARD_TTL, tags: [CONTEST_TAG] })();
const boardEnded = (id: string) => unstable_cache(() => fetchBoardRows(id), ['contest-board-v1', id], { revalidate: ENDED_BOARD_TTL, tags: [CONTEST_TAG] })();

/** All valid submissions of a contest (for the leaderboard) plus headline counts. Ended contests are cached longer. */
export function getBoard(id: string, ended: boolean) {
  return ended ? boardEnded(id) : boardLive(id);
}

/** Top-N final standings for a competition, computed from the cached board. */
export async function getPodium(_supabase: SupabaseClient | undefined, c: Pick<CompetitionSummary, 'id' | 'participation_type' | 'competition_type' | 'scoring_metric'> & { phase?: CompetitionPhase }, n = 3): Promise<PodiumEntry[]> {
  const isTeam = c.participation_type === 'team';
  const { rows } = await getBoard(c.id, c.phase === 'ended');
  const one = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? v[0] ?? null : v);

  const ranked = rankContest(rows, (r) => (isTeam ? r.team_id : r.user_id), c.scoring_metric, c.competition_type === '4-phase');
  return ranked.slice(0, n).map((e) => ({
    rank: e.rank,
    name: isTeam ? (one(e.sample.teams as { name: string } | null))?.name ?? 'Team' : (one(e.sample.users as { full_name: string | null } | null))?.full_name ?? 'Participant',
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
