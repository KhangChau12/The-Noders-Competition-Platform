import type { CompetitionRow } from '@/types/database.types';

export type CompetitionPhase = 'upcoming' | 'registration' | 'public_test' | 'private_test' | 'ended';

/**
 * Computes the current phase of a competition from its timestamps.
 * Accepts either a full CompetitionRow or any object with the required date fields.
 */
export function getCompetitionPhase(
  competition: Pick<
    CompetitionRow,
    | 'registration_start'
    | 'registration_end'
    | 'public_test_end'
    | 'private_test_start'
    | 'private_test_end'
  >,
  now: Date = new Date(),
): CompetitionPhase {
  const regStart = new Date(competition.registration_start);
  const regEnd = new Date(competition.registration_end);
  const publicEnd = new Date(competition.public_test_end);
  const privateStart = competition.private_test_start
    ? new Date(competition.private_test_start)
    : null;
  const privateEnd = competition.private_test_end
    ? new Date(competition.private_test_end)
    : null;

  if (now < regStart) return 'upcoming';
  if (now < regEnd) return 'registration';
  if (now < publicEnd) return 'public_test';
  if (privateStart && privateEnd && now >= privateStart && now < privateEnd) return 'private_test';
  return 'ended';
}

/**
 * Returns the next deadline Date for countdown purposes, or null if competition ended.
 */
export function getNextDeadline(
  competition: Pick<
    CompetitionRow,
    | 'registration_start'
    | 'registration_end'
    | 'public_test_end'
    | 'private_test_end'
  >,
  phase: CompetitionPhase,
): Date | null {
  switch (phase) {
    case 'upcoming':
      return new Date(competition.registration_start);
    case 'registration':
      return new Date(competition.registration_end);
    case 'public_test':
      return new Date(competition.public_test_end);
    case 'private_test':
      return competition.private_test_end ? new Date(competition.private_test_end) : null;
    default:
      return null;
  }
}

/** Returns the human-readable label for a countdown timer based on current phase. */
export function getCountdownLabel(phase: CompetitionPhase): string {
  switch (phase) {
    case 'upcoming':
      return 'Registration starts in';
    case 'registration':
      return 'Registration ends in';
    case 'public_test':
      return 'Public test ends in';
    case 'private_test':
      return 'Private test ends in';
    default:
      return 'Competition ended';
  }
}

/**
 * Returns a {days, hours, minutes, label} countdown object, or undefined if
 * the competition is ended or the deadline is already passed.
 */
export function getCountdown(
  competition: Pick<
    CompetitionRow,
    | 'registration_start'
    | 'registration_end'
    | 'public_test_end'
    | 'private_test_end'
  >,
  phase: CompetitionPhase,
  now: Date = new Date(),
): { days: number; hours: number; minutes: number; label: string } | undefined {
  const target = getNextDeadline(competition, phase);
  if (!target) return undefined;

  const diff = target.getTime() - now.getTime();
  if (diff < 0) return undefined;

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    label: getCountdownLabel(phase),
  };
}
