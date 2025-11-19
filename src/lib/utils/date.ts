import { format, formatDistanceToNow, isAfter, isBefore, parseISO } from 'date-fns';

/**
 * Format a date to a readable string
 */
export function formatDate(date: string | Date, formatStr: string = 'PPP'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr);
}

/**
 * Format a date to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true });
}

/**
 * Format a date to time only (e.g., "14:30")
 */
export function formatTime(date: string | Date): string {
  return formatDate(date, 'HH:mm');
}

/**
 * Format a date to date and time (e.g., "Jan 1, 2024 at 14:30")
 */
export function formatDateTime(date: string | Date): string {
  return formatDate(date, 'PPP \'at\' HH:mm');
}

/**
 * Check if a date is in the past
 */
export function isPast(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return isBefore(dateObj, new Date());
}

/**
 * Check if a date is in the future
 */
export function isFuture(date: string | Date): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return isAfter(dateObj, new Date());
}

/**
 * Calculate time remaining until a date
 * Returns { days, hours, minutes, seconds }
 */
export function getTimeRemaining(date: string | Date): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
} {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const total = dateObj.getTime() - new Date().getTime();

  if (total <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
  }

  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));

  return { days, hours, minutes, seconds, total };
}

/**
 * Get competition phase based on current time
 */
export function getCompetitionPhase(competition: {
  registration_start: string;
  registration_end: string;
  public_test_start: string;
  public_test_end: string;
  private_test_start?: string | null;
  private_test_end?: string | null;
  competition_type: '3-phase' | '4-phase';
}): 'upcoming' | 'registration' | 'public_test' | 'private_test' | 'ended' {
  const now = new Date();

  if (isBefore(now, parseISO(competition.registration_start))) {
    return 'upcoming';
  }

  if (
    isAfter(now, parseISO(competition.registration_start)) &&
    isBefore(now, parseISO(competition.registration_end))
  ) {
    return 'registration';
  }

  if (
    isAfter(now, parseISO(competition.public_test_start)) &&
    isBefore(now, parseISO(competition.public_test_end))
  ) {
    return 'public_test';
  }

  if (
    competition.competition_type === '4-phase' &&
    competition.private_test_start &&
    competition.private_test_end &&
    isAfter(now, parseISO(competition.private_test_start)) &&
    isBefore(now, parseISO(competition.private_test_end))
  ) {
    return 'private_test';
  }

  return 'ended';
}

/**
 * Get next phase transition time
 */
export function getNextPhaseTransition(competition: {
  registration_start: string;
  registration_end: string;
  public_test_start: string;
  public_test_end: string;
  private_test_start?: string | null;
  private_test_end?: string | null;
  competition_type: '3-phase' | '4-phase';
}): Date | null {
  const phase = getCompetitionPhase(competition);
  const now = new Date();

  switch (phase) {
    case 'upcoming':
      return parseISO(competition.registration_start);
    case 'registration':
      return parseISO(competition.public_test_start);
    case 'public_test':
      if (competition.competition_type === '4-phase' && competition.private_test_start) {
        return parseISO(competition.private_test_start);
      }
      return parseISO(competition.public_test_end);
    case 'private_test':
      return competition.private_test_end ? parseISO(competition.private_test_end) : null;
    case 'ended':
      return null;
    default:
      return null;
  }
}
